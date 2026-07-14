import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import type { ExportImageOptions } from './exportPng';

const capturePngDataUrl = async (node: HTMLElement, options: ExportImageOptions): Promise<string> => {
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
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Не удалось сформировать изображение чертежа: ${details}`, { cause: error });
  }
};

export const exportNodeToPdf = async (
  node: HTMLElement,
  fileName: string,
  options: ExportImageOptions = {},
): Promise<void> => {
  const dataUrl = await capturePngDataUrl(node, options);
  if (!dataUrl.startsWith('data:image/png')) {
    throw new Error('Не удалось сформировать PNG для PDF.');
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 0;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  let imgProps: { width: number; height: number };
  try {
    imgProps = pdf.getImageProperties(dataUrl);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Не удалось прочитать изображение для PDF: ${details}`, { cause: error });
  }

  const ratio = Math.min(maxWidth / imgProps.width, maxHeight / imgProps.height);
  const imgWidth = imgProps.width * ratio;
  const imgHeight = imgProps.height * ratio;
  const offsetX = (pageWidth - imgWidth) / 2;
  const offsetY = (pageHeight - imgHeight) / 2;

  try {
    pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, imgWidth, imgHeight);
    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Не удалось сохранить PDF: ${details}`, { cause: error });
  }
};
