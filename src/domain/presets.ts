import type { LayoutPreset } from './types';

/** Шаблоны с фиксированным рисунком. Скребок только внутри последовательности, не на краях. */
export const layoutPresets: LayoutPreset[] = [
  { id: 'only-rubber', name: 'Только резина', description: 'Однородное полотно из резины.', pattern: ['rubber'] },
  { id: 'rubber-pile', name: 'Резина–Ворс', description: 'Базовая комбинация для входных групп.', pattern: ['rubber', 'pile'] },
  { id: 'rubber-brush', name: 'Резина–Щетка', description: 'Агрессивная очистка с резиновым блоком.', pattern: ['rubber', 'brush'] },
  { id: 'rubber-brush-pile', name: 'Резина–Щетка–Ворс', description: 'Усиленная очистка со щеткой.', pattern: ['rubber', 'brush', 'pile'] },
  { id: 'rubber-scraper-pile', name: 'Резина–Скребок–Ворс', description: 'Трёхзонная схема со скребком в центре.', pattern: ['rubber', 'scraper', 'pile'] },
  { id: 'only-pile', name: 'Только ворс', description: 'Однородное полотно из ворса.', pattern: ['pile'] },
  { id: 'only-brush', name: 'Только щетка', description: 'Однородное полотно из щетки.', pattern: ['brush'] },
  { id: 'pile-scraper-rubber', name: 'Ворс–Скребок–Резина', description: 'Скребок в центре, широкие планки по краям.', pattern: ['pile', 'scraper', 'rubber'] },
  { id: 'brush-scraper-pile', name: 'Щетка–Скребок–Ворс', description: 'Интенсивный сценарий со скребком в центре.', pattern: ['brush', 'scraper', 'pile'] },
];
