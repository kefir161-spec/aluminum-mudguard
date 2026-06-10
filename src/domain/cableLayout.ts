import {
  CABLE_EDGE_OFFSET_DEFAULT_MM,
  CABLE_EDGE_OFFSET_MAX_MM,
  CABLE_EDGE_OFFSET_MIN_MM,
  CABLE_SPACING_MAX_MM,
  CABLE_SPACING_MIN_MM,
  MAX_CABLES,
} from './constants';

export type CableLayout = {
  positionsMm: number[];
  spacingsMm: number[];
  edgeOffsetMm: number;
  count: number;
};

const clampEdgeOffset = (value: number): number =>
  Math.min(CABLE_EDGE_OFFSET_MAX_MM, Math.max(CABLE_EDGE_OFFSET_MIN_MM, value));

/** Чем меньше — тем «красивее» число для чертежа. */
export const spacingNiceness = (value: number): number => {
  if (value % 10 === 0) return 0;
  if (value % 5 === 0) return 3;
  const tail = value % 10;
  return 10 + Math.min(tail, 10 - tail);
};

const isValidSpacing = (value: number): boolean =>
  Number.isInteger(value) && value >= CABLE_SPACING_MIN_MM && value <= CABLE_SPACING_MAX_MM;

const buildLayoutFromSpacings = (offset: number, spacings: number[]): CableLayout => {
  const positions = [offset];
  for (const spacing of spacings) {
    positions.push(positions[positions.length - 1] + spacing);
  }
  return {
    positionsMm: positions,
    spacingsMm: spacings,
    edgeOffsetMm: offset,
    count: positions.length,
  };
};

/** Расчёт позиций тросов вдоль длины ковра. Все промежутки между тросами одинаковые. */
export const computeCableLayout = (
  lengthMm: number,
  edgeOffsetMm = CABLE_EDGE_OFFSET_DEFAULT_MM,
): CableLayout | null => {
  const offset = clampEdgeOffset(edgeOffsetMm);
  const span = lengthMm - 2 * offset;

  if (lengthMm <= 0) {
    return { positionsMm: [], spacingsMm: [], edgeOffsetMm: offset, count: 0 };
  }

  if (span < CABLE_SPACING_MIN_MM) {
    if (lengthMm >= 2 * offset) {
      const spacing = Math.round(span / 10) * 10 || Math.round(span);
      if (isValidSpacing(spacing)) {
        return buildLayoutFromSpacings(offset, [spacing]);
      }
    }
    return { positionsMm: [offset], spacingsMm: [], edgeOffsetMm: offset, count: 1 };
  }

  let bestLayout: CableLayout | null = null;
  let bestScore = Infinity;
  let bestSpacingCount = -1;

  for (let spacing = CABLE_SPACING_MIN_MM; spacing <= CABLE_SPACING_MAX_MM; spacing += 1) {
    if (span % spacing !== 0) continue;

    const spacingCount = span / spacing;
    const cableCount = spacingCount + 1;
    if (cableCount < 2 || cableCount > MAX_CABLES) continue;

    const score = spacingNiceness(spacing);
    if (score > bestScore) continue;
    if (score === bestScore && spacingCount <= bestSpacingCount) continue;

    bestScore = score;
    bestSpacingCount = spacingCount;
    bestLayout = buildLayoutFromSpacings(offset, Array.from({ length: spacingCount }, () => spacing));
  }

  return bestLayout;
};
