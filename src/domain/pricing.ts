import type { PricingConfig } from './types';

/** Порог ширины ковра (мм), ниже которого применяется скидка. */
export const NARROW_WIDTH_DISCOUNT_THRESHOLD_MM = 1200;
/** Доля скидки при узкой ширине (10 %). */
export const NARROW_WIDTH_DISCOUNT_RATE = 0.1;

export const isNarrowWidthDiscountEligible = (carpetWidthMm: number): boolean =>
  carpetWidthMm < NARROW_WIDTH_DISCOUNT_THRESHOLD_MM;

export const getNarrowWidthDiscount = (
  enabled: boolean,
  carpetWidthMm: number,
  subtotalPrice: number,
): { applied: boolean; percent: number; amount: number } => {
  if (!enabled || !isNarrowWidthDiscountEligible(carpetWidthMm) || subtotalPrice <= 0) {
    return { applied: false, percent: 0, amount: 0 };
  }

  const amount = subtotalPrice * NARROW_WIDTH_DISCOUNT_RATE;
  return { applied: true, percent: NARROW_WIDTH_DISCOUNT_RATE * 100, amount };
};

export const pricingConfig: PricingConfig = {
  mode: 'per_m2',
  modulePricesPerM2: {
    rubber: 15372,
    pile: 16470,
    brush: 29097,
    scraper: 17019,
  },
  modulePricesPerLinearMeter: {
    rubber: 500,
    pile: 600,
    brush: 900,
    scraper: 700,
  },
};
