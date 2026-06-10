import type { ModuleDefinition, ModuleType } from './types';
import { pricingConfig } from './pricing';

export const moduleDefinitions: Record<ModuleType, ModuleDefinition> = {
  rubber: {
    id: 'rubber',
    name: 'Профиль с резиной',
    shortName: 'Резина',
    description: 'Рифленая резиновая вставка для снятия грубой грязи и влаги.',
    defaultColor: '#2f343a',
    textureType: 'ribbed',
    pricePerM2: pricingConfig.modulePricesPerM2.rubber,
    pricePerLinearMeter: pricingConfig.modulePricesPerLinearMeter.rubber,
  },
  pile: {
    id: 'pile',
    name: 'Профиль с ворсом',
    shortName: 'Ворс',
    description: 'Волокнистая вставка для удержания мелкой грязи и пыли.',
    defaultColor: '#505d6d',
    textureType: 'fiber',
    pricePerM2: pricingConfig.modulePricesPerM2.pile,
    pricePerLinearMeter: pricingConfig.modulePricesPerLinearMeter.pile,
  },
  brush: {
    id: 'brush',
    name: 'Профиль со щеткой',
    shortName: 'Щетка',
    description: 'Жесткая щетина для интенсивной очистки подошвы.',
    defaultColor: '#385a66',
    textureType: 'bristles',
    pricePerM2: pricingConfig.modulePricesPerM2.brush,
    pricePerLinearMeter: pricingConfig.modulePricesPerLinearMeter.brush,
  },
  scraper: {
    id: 'scraper',
    name: 'Алюминиевый профиль-скребок',
    shortName: 'Скребок',
    description: 'Металлический профиль для снятия плотных загрязнений.',
    defaultColor: '#b6c0c9',
    textureType: 'metal',
    pricePerM2: pricingConfig.modulePricesPerM2.scraper,
    pricePerLinearMeter: pricingConfig.modulePricesPerLinearMeter.scraper,
  },
};

export const moduleTypeOrder: ModuleType[] = ['rubber', 'pile', 'brush', 'scraper'];
