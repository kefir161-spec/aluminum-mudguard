import type { ProductConfig } from './types';
import {
  CABLE_EDGE_OFFSET_MAX_MM,
  CABLE_EDGE_OFFSET_MIN_MM,
  CABLE_SPACING_MAX_MM,
  CABLE_SPACING_MIN_MM,
  MAX_CABLES,
  MODULE_GAP_MM,
  PLANK_HEIGHT_MM,
  PLANK_WIDTH_MM,
  PIT_INSET_MM,
  SCRAPER_HEIGHT_MM,
  SCRAPER_WIDTH_MM,
  MIN_ORDER_DIMENSION_MM,
  MAX_ORDER_DIMENSION_MM,
} from './constants';
import {
  getScraperEdgeWarnings,
  getStripNominalWidth,
  isValidPatternSequence,
  patternHasScraperAtEdge,
} from './layoutRules';
import { formatWidthGapWarning } from './layoutGap';

export const validateConfig = (config: ProductConfig): string[] => {
  const warnings: string[] = [];

  if (config.strips.length === 0) {
    warnings.push('Добавьте хотя бы один профиль.');
  }

  const hasWrongNominalWidth = config.strips.some(
    (strip) => Math.abs(strip.widthMm - getStripNominalWidth(strip.type)) > 0.01,
  );
  if (hasWrongNominalWidth) {
    warnings.push(`Ширина профиля должна быть фиксированной: планка ${PLANK_WIDTH_MM} мм, скребок ${SCRAPER_WIDTH_MM} мм.`);
  }

  if (config.layoutPattern && config.layoutPattern.length > 0) {
    if (patternHasScraperAtEdge(config.layoutPattern)) {
      warnings.push('Выбранный рисунок содержит скребок на краю — такая раскладка недопустима.');
    } else if (!isValidPatternSequence(config.strips, config.layoutPattern)) {
      warnings.push('Расположение профилей не соответствует фиксированному рисунку (без дублирования внутри цикла).');
    }
  }

  return warnings;
};

export const validateConfigWithCalculation = (
  config: ProductConfig,
  calculation: ReturnType<typeof import('./calculations').calculateConfig>,
): string[] => {
  const warnings = validateConfig(config);

  if (calculation.cableLayout === null && config.totalLengthMm > 2 * CABLE_EDGE_OFFSET_MIN_MM) {
    if (config.cableLayoutMode === 'manual') {
      warnings.push(
        `Для длины ${Math.round(config.totalLengthMm)} мм нет допустимой ручной раскладки тросов (отступ ${CABLE_EDGE_OFFSET_MIN_MM}–${CABLE_EDGE_OFFSET_MAX_MM} мм, шаг ${CABLE_SPACING_MIN_MM}–${CABLE_SPACING_MAX_MM} мм).`,
      );
    } else {
      warnings.push(
        `Не удалось разместить тросы: шаг ${CABLE_SPACING_MIN_MM}–${CABLE_SPACING_MAX_MM} мм (целые значения), отступ ${CABLE_EDGE_OFFSET_MIN_MM}–${CABLE_EDGE_OFFSET_MAX_MM} мм.`,
      );
    }
  }

  if (calculation.cableLayout && calculation.cableLayout.count > MAX_CABLES) {
    warnings.push(`Количество тросов превышает допустимое (${MAX_CABLES} шт.).`);
  }

  if (calculation.cableLayout?.spacingsMm.some((spacing: number) => !Number.isInteger(spacing))) {
    warnings.push('Расстояния между тросами должны быть целочисленными (мм).');
  }

  const layoutComplete = !calculation.isUnderfilled;
  warnings.unshift(...getScraperEdgeWarnings(config.strips, layoutComplete));

  const widthGapWarning = formatWidthGapWarning(
    calculation.orderTargetWidthMm,
    calculation.nominalLayoutWidthMm,
    calculation.effectiveLayoutWidthMm,
    {
      fitToOrder: calculation.fitToOrderSize,
      fitApplied: calculation.fitApplied,
      isFullyFitted: calculation.isFullyFitted,
      remainderMm: calculation.remainderMm,
    },
  );
  if (widthGapWarning) {
    warnings.unshift(widthGapWarning);
  }

  return warnings;
};

export const productionConstants = {
  plankHeightMm: PLANK_HEIGHT_MM,
  scraperHeightMm: SCRAPER_HEIGHT_MM,
  moduleHeightMm: 20,
  defaultStripWidthMm: PLANK_WIDTH_MM,
  scraperWidthMm: SCRAPER_WIDTH_MM,
  moduleGapMm: MODULE_GAP_MM,
  pitInsetMm: PIT_INSET_MM,
  minOrderDimensionMm: MIN_ORDER_DIMENSION_MM,
  maxOrderDimensionMm: MAX_ORDER_DIMENSION_MM,
};
