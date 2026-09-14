import { resolveLayoutDimensions } from '../domain/gapFit';
import { isOuterKantEnabled, KANT_WIDTH_MM, resolveKantInnerSizeMm } from '../domain/kant';
import type { ProductConfig } from '../domain/types';
import type { ResolvedLayout } from '../domain/gapFit';

export type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'strip' | 'gap';
  stripId?: string;
  gapMm?: number;
};

export type LayoutGeometry = {
  rects: LayoutRect[];
  layoutWidthMm: number;
  effectiveWidthMm: number;
  layoutHeightPx: number;
  matX: number;
  matY: number;
  matWidthPx: number;
  matHeightPx: number;
  scale: number;
  resolved: ResolvedLayout;
  kantEnabled: boolean;
  kantPx: number;
  outerX: number;
  outerY: number;
  outerWidthPx: number;
  outerHeightPx: number;
  /** Габарит вдоль профиля (горизонталь), мм. */
  overallLengthMm: number;
  /** Габарит по планкам (вертикаль), мм. */
  overallWidthMm: number;
};

export type LayoutBuildOptions = {
  /** contain — вписать в область; fillWidth — заполнить по длине (горизонтали) */
  fit?: 'contain' | 'fillWidth';
  align?: 'start' | 'center';
  /** Доля доступной области, занимаемая полотном (1 = максимум). */
  sizeFactor?: number;
};

/**
 * Геометрия раскладки: длина ковра — по горизонтали, планки — по вертикали.
 * Единый масштаб сохраняет пропорции длины и ширины.
 */
export const buildLayoutGeometry = (
  config: ProductConfig,
  viewportWidth: number,
  viewportHeight: number,
  originX: number,
  originY: number,
  options: LayoutBuildOptions = {},
): LayoutGeometry => {
  const { fit = 'contain', align = 'center', sizeFactor = 1 } = options;
  const boundedSizeFactor = Math.max(0.1, Math.min(sizeFactor, 1));
  const resolved = resolveLayoutDimensions(
    config.strips,
    config.totalWidthMm,
    config.totalWidthMm,
    config.fitToOrderSize ?? false,
  );
  const kantEnabled = isOuterKantEnabled(config.hasOuterKant, config.dimensionSource);
  const kantInner = resolveKantInnerSizeMm(
    config.fitToOrderSize ?? false,
    resolved.fitApplied,
    resolved.effectiveWidthMm,
    resolved.nominalWidthMm,
    config.totalLengthMm,
  );
  const targetWidthMm = Math.max(
    kantEnabled ? kantInner.alongPlanksMm : Math.max(config.totalWidthMm, resolved.effectiveWidthMm),
    1,
  );
  const totalLengthMm = Math.max(kantEnabled ? kantInner.alongProfileMm : config.totalLengthMm, 1);
  const kantWidthMm = kantEnabled ? KANT_WIDTH_MM : 0;
  const overallLengthMm = totalLengthMm + 2 * kantWidthMm;
  const overallWidthMm = targetWidthMm + 2 * kantWidthMm;

  const drawableWidth = viewportWidth * boundedSizeFactor;
  const drawableHeight = viewportHeight * boundedSizeFactor;

  let scale =
    fit === 'fillWidth'
      ? drawableWidth / overallLengthMm
      : Math.min(drawableWidth / overallLengthMm, drawableHeight / overallWidthMm);

  let outerWidthPx = overallLengthMm * scale;
  let outerHeightPx = overallWidthMm * scale;

  if (fit === 'fillWidth' && outerHeightPx > drawableHeight) {
    scale = drawableHeight / overallWidthMm;
    outerWidthPx = overallLengthMm * scale;
    outerHeightPx = overallWidthMm * scale;
  }

  const outerX = align === 'start' ? originX : originX + (viewportWidth - outerWidthPx) / 2;
  const outerY = align === 'start' ? originY : originY + (viewportHeight - outerHeightPx) / 2;
  const kantPx = kantWidthMm * scale;
  const matX = outerX + kantPx;
  const matY = outerY + kantPx;
  const matWidthPx = totalLengthMm * scale;
  const matHeightPx = targetWidthMm * scale;
  const rects: LayoutRect[] = [];
  let y = matY;

  config.strips.forEach((strip, index) => {
    const height = strip.widthMm * scale;
    rects.push({ x: matX, y, width: matWidthPx, height, kind: 'strip', stripId: strip.id });
    y += height;

    if (index < config.strips.length - 1) {
      const gapMm = resolved.gapSizesMm[index] ?? 0;
      const gapHeight = gapMm * scale;
      rects.push({ x: matX, y, width: matWidthPx, height: gapHeight, kind: 'gap', gapMm });
      y += gapHeight;
    }
  });

  const layoutHeightPx = resolved.effectiveWidthMm * scale;

  return {
    rects,
    layoutWidthMm: resolved.nominalWidthMm,
    effectiveWidthMm: resolved.effectiveWidthMm,
    layoutHeightPx,
    matX,
    matY,
    matWidthPx,
    matHeightPx,
    scale,
    resolved,
    kantEnabled,
    kantPx,
    outerX,
    outerY,
    outerWidthPx,
    outerHeightPx,
    overallLengthMm,
    overallWidthMm,
  };
};

/** Позиции тросов вдоль длины (горизонтальная ось). */
export const cablePositionsAlongLength = (
  lengthMm: number,
  matStart: number,
  matSpanPx: number,
  positionsMm: number[],
): number[] => positionsMm.map((position) => matStart + (position / lengthMm) * matSpanPx);
