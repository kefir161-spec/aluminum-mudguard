import type { GradedPrice, ModuleType, PricingConfig, ProfileGrade } from './types';

/** Порог ширины ковра (мм), ниже которого применяется скидка. */
export const NARROW_WIDTH_DISCOUNT_THRESHOLD_MM = 1200;
/** Доля скидки при узкой ширине (10 %). */
export const NARROW_WIDTH_DISCOUNT_RATE = 0.1;

export const isNarrowWidthDiscountEligible = (carpetWidthMm: number): boolean =>
  carpetWidthMm < NARROW_WIDTH_DISCOUNT_THRESHOLD_MM;

/** Считает величину отдельно для каждого исполнения профиля. */
export const mapProfileGrades = (compute: (grade: ProfileGrade) => number): GradedPrice => ({
  standard: compute('standard'),
  reinforced: compute('reinforced'),
});

export const getNarrowWidthDiscount = (
  enabled: boolean,
  carpetWidthMm: number,
  subtotalPrice: GradedPrice,
): { applied: boolean; percent: number; amount: GradedPrice } => {
  if (!enabled || !isNarrowWidthDiscountEligible(carpetWidthMm) || subtotalPrice.standard <= 0) {
    return { applied: false, percent: 0, amount: mapProfileGrades(() => 0) };
  }

  return {
    applied: true,
    percent: NARROW_WIDTH_DISCOUNT_RATE * 100,
    amount: mapProfileGrades((grade) => subtotalPrice[grade] * NARROW_WIDTH_DISCOUNT_RATE),
  };
};

/**
 * Розничные цены прайса АО «ПластФактор» от 01.04.26, ₽/кв.м с НДС.
 * Скребок в прайсе идёт одной позицией без деления на исполнения.
 */
export const pricingConfig: PricingConfig = {
  mode: 'per_m2',
  modulePricesPerM2: {
    standard: {
      rubber: 15372,
      pile: 16470,
      brush: 29097,
      scraper: 17019,
    },
    reinforced: {
      rubber: 17400,
      pile: 18450,
      brush: 32625,
      scraper: 17019,
    },
  },
  modulePricesPerLinearMeter: {
    rubber: 500,
    pile: 600,
    brush: 900,
    scraper: 700,
  },
};

export const getModuleUnitPrice = (type: ModuleType, grade: ProfileGrade): number =>
  pricingConfig.mode === 'per_m2'
    ? pricingConfig.modulePricesPerM2[grade][type]
    : pricingConfig.modulePricesPerLinearMeter[type];
