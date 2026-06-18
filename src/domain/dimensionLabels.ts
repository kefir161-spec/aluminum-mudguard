import type { DimensionSource } from './types';

/**
 * Единая терминология во всём приложении (конструктор, вид сверху, чертёж):
 * - Ширина — горизонталь, направление вдоль профиля (orderLengthMm / totalLengthMm);
 * - Длина — вертикаль, габарит полотна по планкам (orderWidthMm / totalWidthMm).
 */
export const carpetWidthLabel = (source: DimensionSource): string =>
  source === 'pit' ? 'Ширина приямка, мм' : 'Ширина ковра, мм';

export const carpetLengthLabel = (source: DimensionSource): string =>
  source === 'pit' ? 'Длина приямка, мм' : 'Длина ковра, мм';

export const carpetWidthHint = (totalLengthMm: number): string =>
  `Ширина полотна ковра: ${totalLengthMm.toFixed(0)} мм`;

export const carpetLengthHint = (totalWidthMm: number): string =>
  `Длина полотна ковра: ${totalWidthMm.toFixed(0)} мм`;

export const formatDrawingSizePair = (widthMm: number, lengthMm: number): string =>
  `Ширина ${Math.round(widthMm)} х Длина ${Math.round(lengthMm)} мм`;

/** Компактный формат для узкой колонки чертежа. */
export const formatCompactDrawingSizePair = (widthMm: number, lengthMm: number): string =>
  `${Math.round(widthMm)}×${Math.round(lengthMm)} мм`;

export const formatPitSubtitle = (widthMm: number, lengthMm: number): string =>
  `приямок ${Math.round(widthMm)}×${Math.round(lengthMm)} мм`;

export const dimensionSourceLabel = (source: DimensionSource): string =>
  source === 'pit' ? 'Приямок' : 'Ковер';
