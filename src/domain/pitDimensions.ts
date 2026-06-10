import { PIT_INSET_MM } from './constants';
import type { DimensionSource, ProductConfig } from './types';

export const effectiveCarpetDimension = (orderDimensionMm: number, source: DimensionSource): number =>
  source === 'pit' ? Math.max(0, orderDimensionMm - PIT_INSET_MM) : orderDimensionMm;

export const resolveCarpetDimensions = (
  orderWidthMm: number,
  orderLengthMm: number,
  source: DimensionSource,
): { totalWidthMm: number; totalLengthMm: number } => ({
  totalWidthMm: effectiveCarpetDimension(orderWidthMm, source),
  totalLengthMm: effectiveCarpetDimension(orderLengthMm, source),
});

/** Целевой габарит по заказу (поле ввода), до укладки планок. */
export const getOrderTargetDimensions = (
  config: Pick<ProductConfig, 'orderWidthMm' | 'orderLengthMm' | 'dimensionSource'>,
): { totalWidthMm: number; totalLengthMm: number } =>
  resolveCarpetDimensions(
    config.orderWidthMm,
    config.orderLengthMm,
    config.dimensionSource ?? 'carpet',
  );
