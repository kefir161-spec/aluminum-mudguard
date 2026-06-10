import { COMPRESSION_AT_1000_MM, COMPRESSION_AT_2000_MM } from './constants';

export type CompressionAllowance = {
  minMm: number;
  maxMm: number;
};

/** Допуск натяжения полотна тросами: ±7 мм при 1000 мм, ±12 мм при 2000 мм (линейно между ними). */
export const getCompressionAllowance = (dimensionMm: number): CompressionAllowance => {
  if (dimensionMm <= 1000) {
    return { minMm: COMPRESSION_AT_1000_MM, maxMm: COMPRESSION_AT_1000_MM };
  }
  if (dimensionMm >= 2000) {
    return { minMm: COMPRESSION_AT_2000_MM, maxMm: COMPRESSION_AT_2000_MM };
  }
  const t = (dimensionMm - 1000) / 1000;
  const allowance = COMPRESSION_AT_1000_MM + t * (COMPRESSION_AT_2000_MM - COMPRESSION_AT_1000_MM);
  return { minMm: allowance, maxMm: allowance };
};

export const isWithinCompressionAllowance = (deltaMm: number, dimensionMm: number): boolean => {
  const allowance = getCompressionAllowance(dimensionMm);
  return Math.abs(deltaMm) <= allowance.maxMm + 0.01;
};
