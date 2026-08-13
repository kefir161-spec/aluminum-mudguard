import { mm, TITLE_BLOCK_MM } from '../domain/eskd';
import { APPROVAL_BLOCK_HEIGHT_MM } from './ApprovalBlock';
import { COMMENT_GAP_MM } from './drawingCommentLayout';
import { getFrameBounds } from './DrawingFrame';
import { SPEC_TABLE_WIDTH_MM } from './DrawingSpecTable';

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
  commentX: number;
  commentMaxW: number;
  commentBottom: number;
  commentMaxH: number;
};

type LayoutInput = {
  hasCableAnnotation: boolean;
};

/** Отступ правой колонки от рамки, чтобы её блоки не сливались с линией рамки. */
const RIGHT_COL_GUTTER_MM = 4;
/** Зона выносок + размерной линии справа от полотна. */
const LEGEND_ZONE_W_MM = 48;
const WIDTH_DIM_W_MM = 16;
const CABLE_ZONE_H_MM = 14;
const LENGTH_DIM_ZONE_H_MM = 12;

/**
 * Компоновка листа: крупное полотно слева, выноски и размеры справа от него,
 * блок «Согласовано», размеры ковра и комплектация — в правой колонке.
 */
export const computeSheetLayout = ({ hasCableAnnotation }: LayoutInput): SheetLayout => {
  const frame = getFrameBounds();

  const titleBlockX = frame.right - mm(TITLE_BLOCK_MM.width);
  const titleBlockY = frame.bottom - mm(TITLE_BLOCK_MM.height);

  const rightColW = mm(SPEC_TABLE_WIDTH_MM);
  const rightColX = frame.right - mm(RIGHT_COL_GUTTER_MM) - rightColW;

  const approvalX = rightColX;
  const approvalY = frame.top + mm(3);

  /** Текст выровнен по правому краю колонки — общему для блока согласования и таблицы. */
  const sizeInfoX = rightColX + rightColW;
  const sizeInfoY = approvalY + mm(APPROVAL_BLOCK_HEIGHT_MM) + mm(4);

  const specX = rightColX;
  const specY = sizeInfoY + mm(22);

  const mainTop = frame.top + mm(2);
  const mainBottom = titleBlockY - mm(2);
  const cableZoneH = hasCableAnnotation ? mm(CABLE_ZONE_H_MM) : 0;

  const matX = frame.left + mm(3);
  const matW = rightColX - matX - mm(LEGEND_ZONE_W_MM) - mm(WIDTH_DIM_W_MM) - mm(3);
  const matY = mainTop + cableZoneH;
  const matH = mainBottom - matY - mm(LENGTH_DIM_ZONE_H_MM);

  const lengthDimY = matY + matH + mm(8);

  const commentX = frame.left + mm(COMMENT_GAP_MM);
  const commentMaxW = titleBlockX - commentX - mm(COMMENT_GAP_MM);
  const commentBottomGap = mm(COMMENT_GAP_MM);

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
    commentX,
    commentMaxW,
    commentBottom: frame.bottom - commentBottomGap,
    commentMaxH: mm(TITLE_BLOCK_MM.height) - commentBottomGap,
  };
};
