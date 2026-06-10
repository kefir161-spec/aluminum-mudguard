import type { PricingConfig } from './types';

export const pricingConfig: PricingConfig = {
  mode: 'per_m2',
  modulePricesPerM2: {
    rubber: 16000,
    pile: 17000,
    brush: 29000,
    scraper: 18000,
  },
  modulePricesPerLinearMeter: {
    rubber: 500,
    pile: 600,
    brush: 900,
    scraper: 700,
  },
};
