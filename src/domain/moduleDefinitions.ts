import type { ModuleDefinition, ModuleType } from './types';

export const moduleDefinitions: Record<ModuleType, ModuleDefinition> = {
  rubber: {
    id: 'rubber',
    name: 'Профиль с резиной',
    shortName: 'Резина',
    description: 'Рифленая резиновая вставка для снятия грубой грязи и влаги.',
    defaultColor: '#2f343a',
    textureType: 'ribbed',
  },
  pile: {
    id: 'pile',
    name: 'Профиль с ворсом',
    shortName: 'Ворс',
    description: 'Волокнистая вставка для удержания мелкой грязи и пыли.',
    defaultColor: '#505d6d',
    textureType: 'fiber',
  },
  brush: {
    id: 'brush',
    name: 'Профиль со щеткой',
    shortName: 'Щетка',
    description: 'Жесткая щетина для интенсивной очистки подошвы.',
    defaultColor: '#385a66',
    textureType: 'bristles',
  },
  scraper: {
    id: 'scraper',
    name: 'Алюминиевый профиль-скребок',
    shortName: 'Скребок',
    description: 'Металлический профиль для снятия плотных загрязнений.',
    defaultColor: '#b6c0c9',
    textureType: 'metal',
  },
};

export const moduleTypeOrder: ModuleType[] = ['rubber', 'pile', 'brush', 'scraper'];
