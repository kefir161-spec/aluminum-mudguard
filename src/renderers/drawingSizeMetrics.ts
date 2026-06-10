import type { CalculationResult } from '../domain/types';

export const getCalculatedLayoutWidthMm = (calculation: CalculationResult): number =>
  calculation.fitToOrderSize && calculation.fitApplied
    ? calculation.effectiveLayoutWidthMm
    : calculation.nominalLayoutWidthMm;

/** Целевая ширина полотна по параметрам (с учётом приямка). */
export const getRequestedLayoutWidthMm = (calculation: CalculationResult): number =>
  calculation.orderTargetWidthMm;
