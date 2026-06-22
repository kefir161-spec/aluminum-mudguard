import {
  CABLE_EDGE_OFFSET_DEFAULT_MM,
  CABLE_EDGE_OFFSET_MAX_MM,
  CABLE_EDGE_OFFSET_MIN_MM,
  CABLE_SPACING_MAX_MM,
  CABLE_SPACING_MIN_MM,
  MAX_CABLES,
} from './constants';

export type CableLayoutMode = 'auto' | 'manual';

export type CableLayout = {
  positionsMm: number[];
  spacingsMm: number[];
  edgeOffsetMm: number;
  count: number;
};

export type CableLayoutOptions = {
  mode?: CableLayoutMode;
  manualCount?: number;
  manualSpacingMm?: number;
  edgeOffsetMm?: number;
};

/** Чем меньше — тем «красивее» число для чертежа. */
export const spacingNiceness = (value: number): number => {
  if (value % 10 === 0) return 0;
  if (value % 5 === 0) return 3;
  const tail = value % 10;
  return 10 + Math.min(tail, 10 - tail);
};

const offsetNiceness = (value: number): number => {
  if (value % 10 === 0) return 0;
  if (value % 5 === 0) return 2;
  return 5;
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

const layoutScore = (layout: CableLayout): number => {
  const spacingScore =
    layout.spacingsMm.length > 0
      ? Math.min(...layout.spacingsMm.map(spacingNiceness))
      : spacingNiceness(CABLE_SPACING_MIN_MM);
  return spacingScore * 100 + offsetNiceness(layout.edgeOffsetMm);
};

const computeCableLayoutForOffset = (lengthMm: number, offset: number): CableLayout | null => {
  const span = lengthMm - 2 * offset;

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

/**
 * Расчёт позиций тросов вдоль длины ковра.
 * Отступ от края подбирается автоматически в диапазоне 100–150 мм.
 */
export const computeCableLayout = (lengthMm: number): CableLayout | null => {
  if (lengthMm <= 0) {
    return { positionsMm: [], spacingsMm: [], edgeOffsetMm: CABLE_EDGE_OFFSET_DEFAULT_MM, count: 0 };
  }

  let bestLayout: CableLayout | null = null;
  let bestScore = Infinity;

  for (let offset = CABLE_EDGE_OFFSET_MIN_MM; offset <= CABLE_EDGE_OFFSET_MAX_MM; offset += 1) {
    const layout = computeCableLayoutForOffset(lengthMm, offset);
    if (!layout || layout.count < 1) continue;

    const score = layoutScore(layout);
    if (score >= bestScore) continue;

    bestScore = score;
    bestLayout = layout;
  }

  return bestLayout;
};

/** Ручная раскладка: симметричные отступы, равномерный шаг между тросами. */
export const buildManualCableLayout = (
  lengthMm: number,
  count: number,
  spacingMm: number,
  edgeOffsetMm: number,
): CableLayout | null => {
  if (lengthMm <= 0 || count < 1 || count > MAX_CABLES) return null;
  if (edgeOffsetMm < CABLE_EDGE_OFFSET_MIN_MM || edgeOffsetMm > CABLE_EDGE_OFFSET_MAX_MM) return null;

  if (count === 1) {
    if (edgeOffsetMm !== lengthMm - edgeOffsetMm) return null;
    return { positionsMm: [edgeOffsetMm], spacingsMm: [], edgeOffsetMm, count: 1 };
  }

  if (!isValidSpacing(spacingMm)) return null;

  const span = lengthMm - 2 * edgeOffsetMm;
  if (span !== (count - 1) * spacingMm) return null;

  return buildLayoutFromSpacings(edgeOffsetMm, Array.from({ length: count - 1 }, () => spacingMm));
};

/** Авто или ручная раскладка тросов в зависимости от настроек проекта. */
export const resolveCableLayout = (lengthMm: number, options: CableLayoutOptions = {}): CableLayout | null => {
  if (options.mode !== 'manual') {
    return computeCableLayout(lengthMm);
  }

  const count = options.manualCount;
  const spacingMm = options.manualSpacingMm;
  const edgeOffsetMm = options.edgeOffsetMm ?? CABLE_EDGE_OFFSET_DEFAULT_MM;

  if (count === undefined || spacingMm === undefined) return null;

  return buildManualCableLayout(lengthMm, count, spacingMm, edgeOffsetMm);
};
