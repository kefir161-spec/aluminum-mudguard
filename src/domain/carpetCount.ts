import { clampIntegerMm } from './numbers';

export const MIN_CARPET_COUNT = 1;
export const MAX_CARPET_COUNT = 99;

export const clampCarpetCount = (value: number): number =>
  clampIntegerMm(value, MIN_CARPET_COUNT, MAX_CARPET_COUNT);

/** «ковёр» / «ковра» / «ковров» по числу. */
export const formatCarpetCountNoun = (count: number): string => {
  const abs = Math.abs(count);
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'ковров';
  if (mod10 === 1) return 'ковёр';
  if (mod10 >= 2 && mod10 <= 4) return 'ковра';
  return 'ковров';
};

/** Подпись для расчёта: «за 2 ковра». Для одного ковра — undefined. */
export const formatCarpetCountSuffix = (count: number): string | undefined => {
  if (count <= 1) return undefined;
  return `за ${count} ${formatCarpetCountNoun(count)}`;
};
