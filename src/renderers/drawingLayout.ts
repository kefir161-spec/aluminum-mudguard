import { mm } from '../domain/eskd';
import { APPROVAL_BLOCK_HEIGHT_MM } from './ApprovalBlock';
import { getFrameBounds } from './DrawingFrame';

export type SheetLayout = {
  matX: number;
  matY: number;
  matW: number;
  matH: number;
  rightColX: number;
  rightColW: number;
  approvalX: number;
  approvalY: number;
  sizeInfoX: number;
  sizeInfoY: number;
  specX: number;
  specY: number;
  titleBlockX: number;
  titleBlockY: number;
  lengthDimY: number;
};

type LayoutInput = {
  hasCableAnnotation: boolean;
};

const TITLE_BLOCK_W_MM = 185;
const TITLE_BLOCK_H_MM = 55;
const RIGHT_COL_W_MM = 74;
const LEGEND_ZONE_W_MM = 38;
const WIDTH_DIM_W_MM = 14;
const CABLE_ZONE_H_MM = 14;
const LENGTH_DIM_ZONE_H_MM = 12;

/**
 * Компоновка листа: крупное полотно слева, выноски и размеры справа от него,
 * блок «Согласовано», размеры ковра и комплектация — в правой колонке.
 */
export const computeSheetLayout = ({ hasCableAnnotation }: LayoutInput): SheetLayout => {
  const frame = getFrameBounds();

  const titleBlockX = frame.right - mm(TITLE_BLOCK_W_MM);
  const titleBlockY = frame.bottom - mm(TITLE_BLOCK_H_MM);

  const rightColX = frame.right - mm(RIGHT_COL_W_MM);
  const rightColW = mm(RIGHT_COL_W_MM);

  const approvalX = rightColX;
  const approvalY = frame.top + mm(3);

  const sizeInfoX = rightColX + rightColW;
  const sizeInfoY = approvalY + mm(APPROVAL_BLOCK_HEIGHT_MM) + mm(4);

  const specX = rightColX;
  const specY = sizeInfoY + mm(14);

  const mainTop = frame.top + mm(2);
  const mainBottom = titleBlockY - mm(2);
  const cableZoneH = hasCableAnnotation ? mm(CABLE_ZONE_H_MM) : 0;

  const matX = frame.left + mm(3);
  const matW = rightColX - matX - mm(LEGEND_ZONE_W_MM) - mm(WIDTH_DIM_W_MM) - mm(3);
  const matY = mainTop + cableZoneH;
  const matH = mainBottom - matY - mm(LENGTH_DIM_ZONE_H_MM);

  const lengthDimY = matY + matH + mm(8);

  return {
    matX,
    matY,
    matW,
    matH,
    rightColX,
    rightColW,
    approvalX,
    approvalY,
    sizeInfoX,
    sizeInfoY,
    specX,
    specY,
    titleBlockX,
    titleBlockY,
    lengthDimY,
  };
};
