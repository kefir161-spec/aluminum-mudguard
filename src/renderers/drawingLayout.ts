import { APPROVAL_BLOCK_HEIGHT } from './ApprovalBlock';

export type SheetLayout = {
  matX: number;
  matY: number;
  matW: number;
  matH: number;
  legendX: number;
  legendY: number;
  legendW: number;
  legendH: number;
  widthDimX: number;
  sizeInfoX: number;
  sizeInfoY: number;
  specY: number;
  specW: number;
  approvalX: number;
  approvalY: number;
  approvalW: number;
  lengthDimY: number;
};

type LayoutInput = {
  sheetW: number;
  sheetH: number;
  hasCableAnnotation: boolean;
  legendCount: number;
};

const MARGIN = 40;
const HEADER_BOTTOM = 100;
const RIGHT_COL_W = 248;
const WIDTH_DIM_W = 80;
const SPEC_BLOCK_H = 210;
const CABLE_ZONE_H = 46;
const LENGTH_DIM_ZONE_H = 34;
const SECTION_GAP = 16;
const RIGHT_SECTION_GAP = 14;

export const LEGEND_ROW_H = 36;
export const LEGEND_SWATCH_W = 76;
export const LEGEND_SWATCH_H = 22;

export const computeLegendHeight = (legendCount: number): number =>
  legendCount > 0 ? 30 + legendCount * LEGEND_ROW_H + 8 : 100;

/**
 * Компоновка листа: ковёр слева (крупно), легенда и размеры справа, спецификация снизу.
 */
export const computeSheetLayout = ({
  sheetW,
  sheetH,
  hasCableAnnotation,
  legendCount,
}: LayoutInput): SheetLayout => {
  const rightColX = sheetW - MARGIN - RIGHT_COL_W;
  const approvalY = 36;
  const legendH = computeLegendHeight(legendCount);
  const legendY = approvalY + APPROVAL_BLOCK_HEIGHT + RIGHT_SECTION_GAP;
  const sizeInfoY = legendY + legendH + RIGHT_SECTION_GAP;
  const mainTop = HEADER_BOTTOM + 8;
  const mainBottom = sheetH - MARGIN - SPEC_BLOCK_H;
  const mainH = mainBottom - mainTop;
  const cableZoneH = hasCableAnnotation ? CABLE_ZONE_H : 0;

  const matX = MARGIN;
  const matW = rightColX - MARGIN - WIDTH_DIM_W - SECTION_GAP;
  const matY = mainTop + cableZoneH;
  const matH = mainH - cableZoneH - LENGTH_DIM_ZONE_H;
  const widthDimX = matX + matW + 10;
  const specY = sheetH - MARGIN - SPEC_BLOCK_H + 6;
  const lengthDimY = matY + matH + 22;

  return {
    matX,
    matY,
    matW,
    matH,
    legendX: rightColX,
    legendY,
    legendW: RIGHT_COL_W,
    legendH,
    widthDimX,
    sizeInfoX: rightColX,
    sizeInfoY,
    specY,
    specW: sheetW - MARGIN * 2,
    approvalX: rightColX,
    approvalY,
    approvalW: RIGHT_COL_W,
    lengthDimY,
  };
};
