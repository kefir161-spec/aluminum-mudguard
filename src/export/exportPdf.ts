import { jsPDF } from 'jspdf';
import { describeUnknownError } from './exportErrors';

export const savePdfFromPngDataUrl = (dataUrl: string, fileName: string): void => {
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
  const maxWidth = pageWidth;
  const maxHeight = pageHeight;

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
