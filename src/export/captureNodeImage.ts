import { toPng } from 'html-to-image';
import { describeUnknownError } from './exportErrors';
import type { ExportImageOptions } from './exportPng';

export const captureNodePngDataUrl = async (
  node: HTMLElement,
  options: ExportImageOptions = {},
): Promise<string> => {
  try {
    return await toPng(node, {
      cacheBust: false,
      skipFonts: options.skipFonts ?? true,
      pixelRatio: options.pixelRatio ?? 2,
      backgroundColor: '#ffffff',
      width: options.width,
      height: options.height,
      style: {
        transform: 'none',
      },
      fetchRequestInit: {
        cache: 'force-cache',
      },
    });
  } catch (error) {
    throw new Error(`Не удалось сформировать изображение чертежа: ${describeUnknownError(error)}`, {
      cause: error,
    });
  }
};
