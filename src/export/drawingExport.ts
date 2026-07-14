import { syncFitLineBadges } from '../renderers/fitLineBadge';
import { SHEET_HEIGHT_PX, SHEET_WIDTH_PX } from '../domain/eskd';
import { captureDrawingSheetPngDataUrl } from './captureDrawingSheet';
import { ensureExportImagesReady, prepareNodeImagesForExport } from './profileImageCache';
import { savePdfFromPngDataUrl } from './exportPdf';
import { savePngFromDataUrl } from './exportPng';

export const DRAWING_EXPORT_WIDTH = SHEET_WIDTH_PX;
export const DRAWING_EXPORT_HEIGHT = SHEET_HEIGHT_PX;
export const DRAWING_EXPORT_ID = 'drawing-sheet-export';

const sanitizeFileName = (name: string): string =>
  name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'drawing';

const waitForPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });

export const getDrawingExportNode = (): HTMLElement => {
  const node = document.getElementById(DRAWING_EXPORT_ID);
  if (!node) {
    throw new Error('Не удалось подготовить чертеж для экспорта.');
  }
  return node;
};

const exportFromNode = async (
  node: HTMLElement,
  fileName: string,
  format: 'pdf' | 'png',
): Promise<void> => {
  await ensureExportImagesReady();
  await document.fonts.ready;
  await waitForPaint();
  syncFitLineBadges(node);
  await prepareNodeImagesForExport(node);
  await waitForPaint();

  const options = { width: DRAWING_EXPORT_WIDTH, height: DRAWING_EXPORT_HEIGHT, pixelRatio: 2 };
  const dataUrl = await captureDrawingSheetPngDataUrl(node, options);

  if (format === 'pdf') {
    savePdfFromPngDataUrl(dataUrl, fileName);
  } else {
    savePngFromDataUrl(dataUrl, fileName);
  }
};

export const exportDrawingPng = async (projectName: string): Promise<void> => {
  const node = getDrawingExportNode();
  await exportFromNode(node, `${sanitizeFileName(projectName)}.png`, 'png');
};

export const exportDrawingPdf = async (projectName: string): Promise<void> => {
  const node = getDrawingExportNode();
  await exportFromNode(node, `${sanitizeFileName(projectName)}.pdf`, 'pdf');
};
