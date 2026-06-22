import { syncFitLineBadges } from '../renderers/fitLineBadge';
import { SHEET_HEIGHT_PX, SHEET_WIDTH_PX } from '../domain/eskd';
import { ensureExportImagesReady, patchExportImageHrefs, preloadPatchedImages } from './profileImageCache';
import { exportNodeToPdf } from './exportPdf';
import { exportNodeToPng } from './exportPng';

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
  patchExportImageHrefs(node);
  await preloadPatchedImages(node);
  await waitForPaint();
  const options = { width: DRAWING_EXPORT_WIDTH, height: DRAWING_EXPORT_HEIGHT, pixelRatio: 2 };
  if (format === 'pdf') {
    await exportNodeToPdf(node, fileName, options);
  } else {
    await exportNodeToPng(node, fileName, options);
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
