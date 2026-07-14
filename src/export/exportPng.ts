import { captureNodePngDataUrl } from './captureNodeImage';

export type ExportImageOptions = {
  width?: number;
  height?: number;
  pixelRatio?: number;
  skipFonts?: boolean;
};

export const exportNodeToPng = async (
  node: HTMLElement,
  fileName: string,
  options: ExportImageOptions = {},
): Promise<void> => {
  const dataUrl = await captureNodePngDataUrl(node, options);

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  link.click();
};
