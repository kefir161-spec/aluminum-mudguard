import { moduleTypeOrder } from '../domain/moduleDefinitions';
import { profileTextureConfig } from '../data/profileTextures';

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

const cacheImageDataUrl = async (url: string): Promise<string> => {
  const key = normalizeAssetKey(url);
  const cached = imageDataUrlCache.get(key);
  if (cached) return cached;

  const response = await fetch(resolveAssetUrl(url));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} для ${url}`);
  }

  const dataUrl = await blobToDataURL(await response.blob());
  imageDataUrlCache.set(key, dataUrl);
  return dataUrl;
};

const prefetchExportImages = async (): Promise<void> => {
  const urls = moduleTypeOrder
    .map((type) => profileTextureConfig[type].moduleSrc)
    .filter((url): url is string => Boolean(url));

  await Promise.all(urls.map((url) => cacheImageDataUrl(url)));
};

/** Предзагружает текстуры профилей один раз — html-to-image пропускает уже data: URL. */
export const ensureExportImagesReady = (): Promise<void> => {
  if (!prefetchPromise) {
    prefetchPromise = prefetchExportImages().catch((error) => {
      prefetchPromise = null;
      throw error;
    });
  }
  return prefetchPromise;
};

export const getExportImageHref = (url: string): string =>
  imageDataUrlCache.get(normalizeAssetKey(url)) ?? url;

/** Подменяет все SVG image на data: URL перед html-to-image. */
export const prepareNodeImagesForExport = async (root: ParentNode): Promise<void> => {
  const images = [...root.querySelectorAll('image')];

  await Promise.all(
    images.map(async (node) => {
      const image = node as SVGImageElement;
      const href = image.href?.baseVal ?? '';
      if (!href || href.startsWith('data:')) return;

      const dataUrl = await cacheImageDataUrl(href);
      image.href.baseVal = dataUrl;
    }),
  );

  const hrefs = new Set(
    images
      .map((node) => (node as SVGImageElement).href?.baseVal ?? '')
      .filter((href) => href.startsWith('data:')),
  );

  if (hrefs.size === 0) return;

  await Promise.all(
    [...hrefs].map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Не удалось декодировать изображение (${src.slice(0, 48)}…)`));
          img.src = src;
        }),
    ),
  );
};
