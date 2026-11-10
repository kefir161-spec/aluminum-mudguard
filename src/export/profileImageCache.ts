import { moduleTypeOrder } from '../domain/moduleDefinitions';
import { profileTextureConfig } from '../data/profileTextures';

const XLINK_NS = 'http://www.w3.org/1999/xlink';
/** Достаточно для чертежа A3; исходные PNG до ~2 МБ иначе раздувают SVG. */
const MAX_EXPORT_EDGE_PX = 512;

const imageDataUrlCache = new Map<string, string>();
let prefetchPromise: Promise<void> | null = null;

const resolveAssetUrl = (url: string): string => new URL(url, window.location.href).href;

export const normalizeAssetKey = (url: string): string => {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
};

const blobToDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Не удалось преобразовать изображение в data URL.'));
    reader.readAsDataURL(blob);
  });

const compressImageForExport = async (blob: Blob): Promise<string> => {
  if (typeof createImageBitmap !== 'function') {
    return blobToDataURL(blob);
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, MAX_EXPORT_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blobToDataURL(blob);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    bitmap.close();
  }
};

const cacheImageDataUrl = async (url: string): Promise<string> => {
  const key = normalizeAssetKey(url);
  const cached = imageDataUrlCache.get(key);
  if (cached) return cached;

  const response = await fetch(resolveAssetUrl(url));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} для ${url}`);
  }

  const dataUrl = await compressImageForExport(await response.blob());
  imageDataUrlCache.set(key, dataUrl);
  return dataUrl;
};

const prefetchExportImages = async (): Promise<void> => {
  const urls = moduleTypeOrder
    .map((type) => profileTextureConfig[type].moduleSrc)
    .filter((url): url is string => Boolean(url));

  await Promise.all(urls.map((url) => cacheImageDataUrl(url)));
};

/** Предзагружает и сжимает текстуры профилей один раз перед экспортом. */
export const ensureExportImagesReady = (): Promise<void> => {
  if (!prefetchPromise) {
    prefetchPromise = prefetchExportImages().catch((error) => {
      prefetchPromise = null;
      throw error;
    });
  }
  return prefetchPromise;
};

const readImageHref = (image: SVGImageElement): string =>
  image.getAttribute('href') ||
  image.getAttributeNS(XLINK_NS, 'href') ||
  image.href?.baseVal ||
  '';

const writeImageHref = (image: SVGImageElement, href: string): void => {
  image.setAttribute('href', href);
  image.setAttributeNS(XLINK_NS, 'href', href);
};

/**
 * Подставляет сжатые data URL в <image> клона SVG.
 * Без сжатия сотни копий исходных PNG (до ~2 МБ) ломают загрузку blob SVG → Image.
 */
export const inlineSvgImagesForExport = async (svg: SVGSVGElement): Promise<void> => {
  const images = [...svg.querySelectorAll('image')] as SVGImageElement[];
  if (images.length === 0) return;

  const uniqueHrefs = [
    ...new Set(
      images
        .map((image) => readImageHref(image))
        .filter((href) => Boolean(href) && !href.startsWith('data:')),
    ),
  ];

  await Promise.all(uniqueHrefs.map((href) => cacheImageDataUrl(href)));

  for (const image of images) {
    const rawHref = readImageHref(image);
    if (!rawHref || rawHref.startsWith('data:')) continue;
    writeImageHref(image, await cacheImageDataUrl(rawHref));
  }
};
