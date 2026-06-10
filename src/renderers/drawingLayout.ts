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
  lengthDimX: number;
  widthDimY: number;
  specY: number;
  approvalX: number;
  approvalY: number;
  approvalW: number;
};

type LayoutInput = {
  sheetW: number;
  hasCableAnnotation: boolean;
};

const RIGHT_COL_W = 200;
const LEGEND_H = 156;
const MARGIN = 48;
const SPEC_Y = 448;
const APPROVAL_TOP = 34;
const SECTION_GAP = 22;

/** Зоны чертежа: согласование сверху справа, легенда ниже, ковёр слева без наложений. */
export const computeSheetLayout = ({ sheetW, hasCableAnnotation }: LayoutInput): SheetLayout => {
  const rightColX = sheetW - MARGIN - RIGHT_COL_W;
  const approvalY = APPROVAL_TOP;
  const legendY = approvalY + APPROVAL_BLOCK_HEIGHT + SECTION_GAP;
  const matY = legendY;
  const lengthDimW = 36;
  const cableZoneW = hasCableAnnotation ? 72 : 0;

  const legendX = rightColX;
  const lengthDimX = legendX - lengthDimW - 10;
  const matRight = lengthDimX - 12;
  const matX = MARGIN + cableZoneW;
  const matW = Math.max(320, matRight - matX);
  const matH = Math.min(248, SPEC_Y - matY - 36);

  return {
    matX,
    matY,
    matW,
    matH,
    legendX,
    legendY,
    legendW: RIGHT_COL_W,
    legendH: LEGEND_H,
    lengthDimX,
    widthDimY: matY - 18,
    specY: SPEC_Y,
    approvalX: rightColX,
    approvalY,
    approvalW: RIGHT_COL_W,
  };
};
