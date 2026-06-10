import { toPng } from 'html-to-image';

export type ExportImageOptions = {
  width?: number;
  height?: number;
  pixelRatio?: number;
};

export const exportNodeToPng = async (
  node: HTMLElement,
  fileName: string,
  options: ExportImageOptions = {},
): Promise<void> => {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: options.pixelRatio ?? 2,
    backgroundColor: '#ffffff',
    width: options.width,
    height: options.height,
    style: {
      transform: 'none',
    },
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  link.click();
};
