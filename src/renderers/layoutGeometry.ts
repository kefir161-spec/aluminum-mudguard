import { resolveLayoutDimensions } from '../domain/gapFit';
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
};

export type LayoutBuildOptions = {
  /** contain — вписать в область; fillWidth — заполнить по длине (горизонтали) */
  fit?: 'contain' | 'fillWidth';
  align?: 'start' | 'center';
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
  const { fit = 'contain', align = 'center' } = options;
  const resolved = resolveLayoutDimensions(
    config.strips,
    config.totalWidthMm,
    config.totalWidthMm,
    config.fitToOrderSize ?? false,
  );
  const targetWidthMm = Math.max(config.totalWidthMm, resolved.effectiveWidthMm, 1);
  const totalLengthMm = Math.max(config.totalLengthMm, 1);

  let scale =
    fit === 'fillWidth'
      ? viewportWidth / totalLengthMm
      : Math.min(viewportWidth / totalLengthMm, viewportHeight / targetWidthMm);

  let matWidthPx = totalLengthMm * scale;
  let matHeightPx = targetWidthMm * scale;

  if (fit === 'fillWidth' && matHeightPx > viewportHeight) {
    scale = viewportHeight / targetWidthMm;
    matWidthPx = totalLengthMm * scale;
    matHeightPx = targetWidthMm * scale;
  }

  const matX = align === 'start' ? originX : originX + (viewportWidth - matWidthPx) / 2;
  const matY = align === 'start' ? originY : originY + (viewportHeight - matHeightPx) / 2;
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
  };
};

/** Позиции тросов вдоль длины (горизонтальная ось). */
export const cablePositionsAlongLength = (
  lengthMm: number,
  matStart: number,
  matSpanPx: number,
  positionsMm: number[],
): number[] => positionsMm.map((position) => matStart + (position / lengthMm) * matSpanPx);
