import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import type { ExportImageOptions } from './exportPng';

export const exportNodeToPdf = async (
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

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  const imgProps = pdf.getImageProperties(dataUrl);
  const ratio = Math.min(maxWidth / imgProps.width, maxHeight / imgProps.height);
  const imgWidth = imgProps.width * ratio;
  const imgHeight = imgProps.height * ratio;
  const offsetX = (pageWidth - imgWidth) / 2;
  const offsetY = (pageHeight - imgHeight) / 2;

  pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, imgWidth, imgHeight);
  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};
