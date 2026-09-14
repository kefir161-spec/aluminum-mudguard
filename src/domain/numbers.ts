import {
  CABLE_EDGE_OFFSET_MAX_MM,
  CABLE_EDGE_OFFSET_MIN_MM,
  CABLE_SPACING_MAX_MM,
  CABLE_SPACING_MIN_MM,
  MAX_CABLES,
  MAX_CARPET_LENGTH_MM,
  MAX_CARPET_WIDTH_MM,
  MIN_ORDER_DIMENSION_MM,
} from './constants';

export const MIN_STRIP_WIDTH_MM = 8;

export const clampMm = (value: number, min = MIN_STRIP_WIDTH_MM, max = 50_000): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

/** Ширина ковра (orderLengthMm) — не более 3 м. */
export const clampCarpetWidthMm = (value: number): number =>
  clampMm(value, MIN_ORDER_DIMENSION_MM, MAX_CARPET_WIDTH_MM);

/** Длина ковра (orderWidthMm) — без лимита 3 м. */
export const clampCarpetLengthMm = (value: number): number =>
  clampMm(value, MIN_ORDER_DIMENSION_MM, MAX_CARPET_LENGTH_MM);

export const clampIntegerMm = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
};

export const clampCableEdgeOffset = (value: number): number =>
  clampIntegerMm(value, CABLE_EDGE_OFFSET_MIN_MM, CABLE_EDGE_OFFSET_MAX_MM);

export const clampCableCount = (value: number): number => clampIntegerMm(value, 1, MAX_CABLES);

export const clampCableSpacing = (value: number): number =>
  clampIntegerMm(value, CABLE_SPACING_MIN_MM, CABLE_SPACING_MAX_MM);

/** Значение для input type=number без экспоненциальной записи */
export const formatMmInput = (value: number, fractionDigits = 1): number => {
  if (!Number.isFinite(value)) return MIN_STRIP_WIDTH_MM;
  const factor = 10 ** fractionDigits;
  return Math.round(value * factor) / factor;
};
