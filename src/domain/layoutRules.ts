import {
  MODULE_GAP_MM,
  PLANK_WIDTH_MM,
  SCRAPER_WIDTH_MM,
} from './constants';
import { formatWidthGapWarning } from './layoutGap';
import type { ModuleType, Strip } from './types';

export const getStripNominalWidth = (type: ModuleType): number =>
  type === 'scraper' ? SCRAPER_WIDTH_MM : PLANK_WIDTH_MM;

/** Планка и скребок имеют фиксированную заводскую ширину — без подрезки и расширения. */
export const normalizeStripWidth = (strip: Strip): Strip => ({
  ...strip,
  widthMm: getStripNominalWidth(strip.type),
});

export const createStrip = (type: ModuleType): Strip => ({
  id: crypto.randomUUID(),
  type,
  widthMm: getStripNominalWidth(type),
});

export const computeLayoutWidth = (strips: Strip[]): number => {
  if (strips.length === 0) return 0;
  const stripSum = strips.reduce((sum, strip) => sum + strip.widthMm, 0);
  return stripSum + (strips.length - 1) * MODULE_GAP_MM;
};

export const computeGapTotal = (stripCount: number): number =>
  stripCount > 1 ? (stripCount - 1) * MODULE_GAP_MM : 0;

export const countPlugs = (strips: Strip[]): number =>
  strips.filter((strip) => strip.type !== 'scraper').length * 2;

/** Втулки: (общее число профилей − 1) × число тросов — в конце ряда втулок нет. */
export const countBushings = (stripCount: number, cableCount: number): number => {
  if (cableCount <= 0 || stripCount <= 1) return 0;
  return (stripCount - 1) * cableCount;
};

export const patternHasScraperAtEdge = (pattern: ModuleType[]): boolean =>
  pattern.length > 0 && (pattern[0] === 'scraper' || pattern[pattern.length - 1] === 'scraper');

export const hasScraperAtEdge = (strips: Strip[]): boolean =>
  strips.length > 0 && (strips[0].type === 'scraper' || strips[strips.length - 1].type === 'scraper');

export const hasScraperAtStart = (strips: Strip[]): boolean =>
  strips.length > 0 && strips[0].type === 'scraper';

export const hasScraperAtEnd = (strips: Strip[]): boolean =>
  strips.length > 0 && strips[strips.length - 1].type === 'scraper';

export const SCRAPER_AT_START_WARNING =
  'Ковёр не может начинаться алюминиевым скребком — по краям только широкие планки.';

export const SCRAPER_AT_END_WARNING =
  'Ковёр не может заканчиваться алюминиевым скребком — по краям только широкие планки.';

/** Предупреждения о скребке на краю: конец проверяется только на завершённой раскладке. */
export const getScraperEdgeWarnings = (
  strips: Strip[],
  layoutComplete: boolean,
): string[] => {
  const warnings: string[] = [];
  if (hasScraperAtStart(strips)) warnings.push(SCRAPER_AT_START_WARNING);
  if (layoutComplete && hasScraperAtEnd(strips)) warnings.push(SCRAPER_AT_END_WARNING);
  return warnings;
};

export const canInsertScraperAt = (insertAt: number): boolean => insertAt > 0;

const plankTypesFromPattern = (pattern: ModuleType[]): ModuleType[] => {
  const planks = pattern.filter((type) => type !== 'scraper');
  return planks.length > 0 ? planks : ['rubber'];
};

/** Скребок только внутри полотна; крайние скребки удаляются без изменения ширины планок. */
export const ensureWidePlanksAtEdges = (strips: Strip[]): Strip[] => {
  const result = strips.map((strip) => ({ ...strip }));

  while (result.length > 0 && result[0].type === 'scraper') {
    result.shift();
  }
  while (result.length > 0 && result[result.length - 1].type === 'scraper') {
    result.pop();
  }

  return result.map(normalizeStripWidth);
};

export const normalizeStripWidths = (strips: Strip[]): Strip[] => strips.map(normalizeStripWidth);

/** Нормализация ширин при ручной сборке — скребки на краю не удаляются. */
export const normalizeStrips = (strips: Strip[]): Strip[] => normalizeStripWidths(strips);

const resolveEdgeType = (type: ModuleType, isEdge: boolean, pattern: ModuleType[]): ModuleType => {
  if (!isEdge || type !== 'scraper') return type;
  return plankTypesFromPattern(pattern)[0];
};

export const isValidPatternSequence = (strips: Strip[], pattern: ModuleType[]): boolean => {
  if (pattern.length === 0 || strips.length === 0) return true;
  return strips.every((strip, index) => strip.type === pattern[index % pattern.length]);
};

const appendNominalStrip = (strips: Strip[], type: ModuleType): void => {
  strips.push(createStrip(type));
};

const canAppendType = (strips: Strip[], type: ModuleType, targetWidthMm: number, isFirst: boolean, pattern: ModuleType[]): boolean => {
  const gapBefore = strips.length > 0 ? MODULE_GAP_MM : 0;
  const resolved = resolveEdgeType(type, isFirst, pattern);
  const nextWidth = computeLayoutWidth(strips) + gapBefore + getStripNominalWidth(resolved);
  return nextWidth <= targetWidthMm + 0.01;
};

/** Добавляет целые планки в остаток (после снятия краевого скребка и т.п.). */
export const fillLayoutRemainder = (
  strips: Strip[],
  pattern: ModuleType[],
  targetWidthMm: number,
): Strip[] => {
  const result = strips.map((strip) => ({ ...strip }));
  const plankTypes = plankTypesFromPattern(pattern);
  let plankIndex = 0;
  let guard = 0;

  while (guard++ < 500 && computeLayoutWidth(result) < targetWidthMm - 0.01) {
    let appended = false;
    for (let offset = 0; offset < plankTypes.length; offset += 1) {
      const type = plankTypes[(plankIndex + offset) % plankTypes.length];
      if (!canAppendType(result, type, targetWidthMm, result.length === 0, pattern)) continue;
      result.push(createStrip(type));
      plankIndex += offset + 1;
      appended = true;
      break;
    }
    if (!appended) break;
  }

  return result.map(normalizeStripWidth);
};

/** Комбинация профилей в порядке раскладки на полотне. */
export const derivePatternFromStrips = (strips: Strip[]): ModuleType[] =>
  strips.map((strip) => strip.type);

/** Короткая комбинация для UI — не вся повторённая раскладка. */
export const getDisplayLayoutPattern = (
  strips: Strip[],
  savedPattern?: ModuleType[],
  autoFillEnabled = false,
): ModuleType[] => {
  const fromStrips = derivePatternFromStrips(strips);
  if (autoFillEnabled && savedPattern?.length) return savedPattern;
  if (savedPattern?.length && fromStrips.length > savedPattern.length * 2) return savedPattern;
  return fromStrips;
};

/**
 * Следующий профиль строго по порядку комбинации.
 * Не подбирает «что влезет» в хвост — иначе тонкие скребки забивают остаток подряд.
 */
const appendNextFromPattern = (
  strips: Strip[],
  pattern: ModuleType[],
  targetWidthMm: number,
  patternIndex: number,
): number | null => {
  const rawType = pattern[patternIndex % pattern.length];
  const gapBefore = strips.length > 0 ? MODULE_GAP_MM : 0;
  const type = resolveEdgeType(rawType, strips.length === 0, pattern);
  const nextWidth = computeLayoutWidth(strips) + gapBefore + getStripNominalWidth(type);
  if (nextWidth > targetWidthMm + 0.01) return null;
  appendNominalStrip(strips, type);
  return patternIndex + 1;
};

/** Заполняет ширину полотна повторением комбинации (без обрезки краевых скребков). */
export const rebuildLayoutToTargetWidth = (pattern: ModuleType[], targetWidthMm: number): Strip[] => {
  if (pattern.length === 0) return [];

  const strips: Strip[] = [];
  let patternIndex = 0;
  let guard = 0;

  while (guard++ < 2000 && computeLayoutWidth(strips) < targetWidthMm - 0.01) {
    const nextIndex = appendNextFromPattern(strips, pattern, targetWidthMm, patternIndex);
    if (nextIndex === null) break;
    patternIndex = nextIndex;
  }

  return normalizeStripWidths(strips);
};

export const buildStripsFromPattern = (
  pattern: ModuleType[],
  targetWidthMm: number,
): { strips: Strip[]; warning?: string } => {
  if (pattern.length === 0) {
    return { strips: [], warning: 'Шаблон не содержит профилей.' };
  }
  if (patternHasScraperAtEdge(pattern)) {
    return { strips: [], warning: 'Рисунок не может начинаться или заканчиваться алюминиевым скребком.' };
  }

  const strips: Strip[] = [];
  let patternIndex = 0;

  while (computeLayoutWidth(strips) < targetWidthMm - 0.01) {
    const nextIndex = appendNextFromPattern(strips, pattern, targetWidthMm, patternIndex);
    if (nextIndex === null) break;
    patternIndex = nextIndex;
  }

  if (strips.length === 0) {
    const type = resolveEdgeType(pattern[0], true, pattern);
    if (targetWidthMm >= getStripNominalWidth(type)) {
      appendNominalStrip(strips, type);
    }
  }

  let fixed = ensureWidePlanksAtEdges(strips);
  fixed = fillLayoutRemainder(fixed, pattern, targetWidthMm);
  fixed = normalizeStripWidths(fixed);

  if (hasScraperAtEdge(fixed)) {
    return { strips: [], warning: 'Итоговая раскладка не может начинаться или заканчиваться скребком.' };
  }

  const filledWidth = computeLayoutWidth(fixed);
  const gapWarning =
    formatWidthGapWarning(Math.round(targetWidthMm), Math.round(filledWidth), Math.round(filledWidth)) ?? undefined;

  return { strips: fixed, warning: gapWarning };
};
