import { resolveLayoutDimensions } from '../domain/gapFit';
import type { ProductConfig } from '../domain/types';
import type { ResolvedLayout } from '../domain/gapFit';

export type LayoutRect = {
  x: number;
  width: number;
  kind: 'strip' | 'gap';
  stripId?: string;
  gapMm?: number;
};

export type LayoutGeometry = {
  rects: LayoutRect[];
  layoutWidthMm: number;
  effectiveWidthMm: number;
  layoutWidthPx: number;
  scale: number;
  resolved: ResolvedLayout;
};

/** Масштаб по заказной ширине; зазоры с учётом подгонки под заказ. */
export const buildLayoutGeometry = (
  config: ProductConfig,
  drawableWidth: number,
  startX: number,
): LayoutGeometry => {
  const resolved = resolveLayoutDimensions(
    config.strips,
    config.totalWidthMm,
    config.totalWidthMm,
    config.fitToOrderSize ?? false,
  );
  const targetWidthMm = Math.max(config.totalWidthMm, resolved.effectiveWidthMm, 1);
  const scale = drawableWidth / targetWidthMm;
  const rects: LayoutRect[] = [];
  let x = startX;

  config.strips.forEach((strip, index) => {
    const width = strip.widthMm * scale;
    rects.push({ x, width, kind: 'strip', stripId: strip.id });
    x += width;

    if (index < config.strips.length - 1) {
      const gapMm = resolved.gapSizesMm[index] ?? 0;
      const gapWidth = gapMm * scale;
      rects.push({ x, width: gapWidth, kind: 'gap', gapMm });
      x += gapWidth;
    }
  });

  const layoutWidthPx = resolved.effectiveWidthMm * scale;

  return {
    rects,
    layoutWidthMm: resolved.nominalWidthMm,
    effectiveWidthMm: resolved.effectiveWidthMm,
    layoutWidthPx,
    scale,
    resolved,
  };
};

export const cableYPositions = (
  lengthMm: number,
  drawableTop: number,
  drawableHeight: number,
  positionsMm: number[],
): number[] => positionsMm.map((position) => drawableTop + (position / lengthMm) * drawableHeight);
