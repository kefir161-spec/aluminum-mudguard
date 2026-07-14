export type ExportImageOptions = {
  width?: number;
  height?: number;
  pixelRatio?: number;
  skipFonts?: boolean;
};

export const savePngFromDataUrl = (dataUrl: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  link.click();
};
