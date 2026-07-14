import { jsPDF } from 'jspdf';
import { captureNodePngDataUrl } from './captureNodeImage';
import { describeUnknownError } from './exportErrors';
import type { ExportImageOptions } from './exportPng';

export const exportNodeToPdf = async (
  node: HTMLElement,
  fileName: string,
  options: ExportImageOptions = {},
): Promise<void> => {
  const dataUrl = await captureNodePngDataUrl(node, options);
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
    throw new Error(`Не удалось прочитать изображение для PDF: ${describeUnknownError(error)}`, { cause: error });
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
    throw new Error(`Не удалось сохранить PDF: ${describeUnknownError(error)}`, { cause: error });
  }
};
