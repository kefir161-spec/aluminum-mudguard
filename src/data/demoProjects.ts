import type { ProductConfig } from '../domain/types';
import { CABLE_EDGE_OFFSET_DEFAULT_MM } from '../domain/constants';
import { getStripNominalWidth } from '../domain/layoutRules';
import { resolveCarpetDimensions } from '../domain/pitDimensions';
import { productionConstants } from '../domain/validation';

const now = new Date().toISOString();

export const DEMO_PROJECT_IDS = {
  tcEntrance: 'demo-tc-rubber-pile',
  office: 'demo-office-pile-scraper-rubber',
  intensive: 'demo-intensive-rubber-brush-scraper',
} as const;

export const demoProjectIdSet = new Set<string>(Object.values(DEMO_PROJECT_IDS));

const makeStrips = (pattern: Array<'rubber' | 'pile' | 'brush' | 'scraper'>, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: crypto.randomUUID(),
    type: pattern[index % pattern.length],
    widthMm: getStripNominalWidth(pattern[index % pattern.length]),
  }));

export const createDemoProjects = (): ProductConfig[] => {
  const carpet1 = resolveCarpetDimensions(1200, 1800, 'carpet');
  const carpet2 = resolveCarpetDimensions(900, 1400, 'carpet');
  const carpet3 = resolveCarpetDimensions(1500, 2000, 'carpet');

  return [
    {
      id: DEMO_PROJECT_IDS.tcEntrance,
      projectName: 'Входная группа ТЦ — Резина–Ворс',
      clientName: 'ТЦ Маяк',
      managerName: 'Менеджер А',
      orderWidthMm: 1200,
      orderLengthMm: 1800,
      totalWidthMm: carpet1.totalWidthMm,
      totalLengthMm: carpet1.totalLengthMm,
      dimensionSource: 'carpet',
      defaultStripWidthMm: productionConstants.defaultStripWidthMm,
      layoutPattern: ['rubber', 'pile'],
      cableEdgeOffsetMm: CABLE_EDGE_OFFSET_DEFAULT_MM,
      strips: makeStrips(['rubber', 'pile'], 40),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_PROJECT_IDS.office,
      projectName: 'Офис — Ворс–Скребок–Резина',
      clientName: 'БЦ Horizon',
      managerName: 'Менеджер Б',
      orderWidthMm: 900,
      orderLengthMm: 1400,
      totalWidthMm: carpet2.totalWidthMm,
      totalLengthMm: carpet2.totalLengthMm,
      dimensionSource: 'carpet',
      defaultStripWidthMm: productionConstants.defaultStripWidthMm,
      layoutPattern: ['pile', 'scraper', 'rubber'],
      cableEdgeOffsetMm: CABLE_EDGE_OFFSET_DEFAULT_MM,
      strips: makeStrips(['pile', 'scraper', 'rubber'], 30),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_PROJECT_IDS.intensive,
      projectName: 'Интенсивный вход — Резина–Щетка–Скребок',
      clientName: 'Логистический центр',
      managerName: 'Менеджер В',
      orderWidthMm: 1500,
      orderLengthMm: 2000,
      totalWidthMm: carpet3.totalWidthMm,
      totalLengthMm: carpet3.totalLengthMm,
      dimensionSource: 'carpet',
      defaultStripWidthMm: productionConstants.defaultStripWidthMm,
      layoutPattern: ['rubber', 'scraper', 'brush'],
      cableEdgeOffsetMm: CABLE_EDGE_OFFSET_DEFAULT_MM,
      strips: makeStrips(['rubber', 'scraper', 'brush'], 45),
      createdAt: now,
      updatedAt: now,
    },
  ];
};
