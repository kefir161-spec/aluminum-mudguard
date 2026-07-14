import { moduleTypeOrder } from '../domain/moduleDefinitions';
import { profileTextureConfig } from '../data/profileTextures';

const imageDataUrlCache = new Map<string, string>();
let prefetchPromise: Promise<void> | null = null;

const normalizeAssetKey = (url: string): string => {
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
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const prefetchExportImages = async (): Promise<void> => {
  const urls = moduleTypeOrder
    .map((type) => profileTextureConfig[type].moduleSrc)
    .filter((url): url is string => Boolean(url));

  await Promise.all(
    urls.map(async (url) => {
      const key = normalizeAssetKey(url);
      if (imageDataUrlCache.has(key)) return;
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const dataUrl = await blobToDataURL(await response.blob());
        imageDataUrlCache.set(key, dataUrl);
      } catch {
        // Оставляем исходный same-origin URL — экспорт попробует без data: подмены.
      }
    }),
  );
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

/** Подменяет href у SVG image на закэшированные data: URL перед html-to-image. */
export const patchExportImageHrefs = (root: ParentNode): void => {
  root.querySelectorAll('image').forEach((node) => {
    const image = node as SVGImageElement;
    const href = image.href?.baseVal ?? '';
    if (!href || href.startsWith('data:')) return;
    const cached = getExportImageHref(href);
    if (cached !== href) {
      image.href.baseVal = cached;
    }
  });
};

/** Дожидается декодирования уникальных data: URL перед захватом. */
export const preloadPatchedImages = (root: ParentNode): Promise<void> => {
  const hrefs = new Set<string>();
  root.querySelectorAll('image').forEach((node) => {
    const href = (node as SVGImageElement).href?.baseVal ?? '';
    if (href.startsWith('data:')) hrefs.add(href);
  });

  if (hrefs.size === 0) return Promise.resolve();

  return Promise.all(
    [...hrefs].map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => undefined);
};
