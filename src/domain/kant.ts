import type { DimensionSource } from './types';

/** Ширина наружного обрамления (канта) с каждой стороны, мм. */
export const KANT_WIDTH_MM = 50;

/** Розничная цена канта, ₽/пог. м с НДС. */
export const KANT_PRICE_PER_LINEAR_METER = 1537;

export type KantMetrics = {
  enabled: boolean;
  widthMm: number;
  /** Габарит по планкам (UI «длина»), мм. */
  overallWidthMm: number;
  /** Габарит вдоль профиля (UI «ширина»), мм. */
  overallLengthMm: number;
  linearMeters: number;
  unitPrice: number;
  price: number;
};

export const isOuterKantEnabled = (
  hasOuterKant: boolean | undefined,
  dimensionSource: DimensionSource | undefined,
): boolean => Boolean(hasOuterKant) && dimensionSource !== 'pit';

/** Наружный габарит: кант 50 мм с каждой стороны, +100 мм к каждой оси. */
const withKantOverallMm = (innerMm: number, enabled: boolean): number =>
  enabled ? innerMm + 2 * KANT_WIDTH_MM : innerMm;

export const getKantMetrics = (
  enabled: boolean,
  carpetAlongPlanksMm: number,
  carpetAlongProfileMm: number,
  carpetCount = 1,
): KantMetrics => {
  const overallWidthMm = withKantOverallMm(carpetAlongPlanksMm, enabled);
  const overallLengthMm = withKantOverallMm(carpetAlongProfileMm, enabled);

  if (!enabled) {
    return {
      enabled: false,
      widthMm: 0,
      overallWidthMm,
      overallLengthMm,
      linearMeters: 0,
      unitPrice: KANT_PRICE_PER_LINEAR_METER,
      price: 0,
    };
  }

  const qty = Math.max(1, carpetCount);
  const unitMeters = (2 * (overallWidthMm + overallLengthMm)) / 1000;

  return {
    enabled: true,
    widthMm: KANT_WIDTH_MM,
    overallWidthMm,
    overallLengthMm,
    linearMeters: unitMeters * qty,
    unitPrice: KANT_PRICE_PER_LINEAR_METER,
    price: unitMeters * KANT_PRICE_PER_LINEAR_METER * qty,
  };
};
