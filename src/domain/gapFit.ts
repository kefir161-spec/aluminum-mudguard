import { EXACT_SPACER_FIT_MIN_LENGTH_MM, MODULE_GAP_MM, SPACER_GAP_MAX_MM, SPACER_GAP_MIN_MM } from './constants';
import type { Strip } from './types';

export type FitAction = 'tighten' | 'relax' | 'none';

export type ResolvedLayout = {
  stripSumMm: number;
  gapSizesMm: number[];
  nominalWidthMm: number;
  effectiveWidthMm: number;
  remainderMm: number;
  fitApplied: boolean;
  fitAdjustmentMm: number;
  recommendedAdjustmentMm: number;
  fitAction: FitAction;
  fitActionMm: number;
  isFullyFitted: boolean;
  fitNote?: string;
  drawingFitNote?: string;
};

const formatMm = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
};

/** Суммарный ход проставок: ±0,5 мм на каждую. */
export const spacerFitLimitMm = (gapCount: number): number =>
  Math.max(0, gapCount) * (SPACER_GAP_MAX_MM - MODULE_GAP_MM);

/** Длина по ламелям больше 700 мм подгоняется проставками всегда. */
export const shouldFitSpacers = (carpetLengthMm: number, fitToOrderSize: boolean | undefined): boolean =>
  (fitToOrderSize ?? false) || carpetLengthMm > EXACT_SPACER_FIT_MIN_LENGTH_MM;

/** Делит нужную сумму зазора поровну, не выходя за 4,5–5,5 мм на проставку. */
const fitSpacerGaps = (
  gapCount: number,
  stripSumMm: number,
  targetMm: number,
): { gapSizesMm: number[]; effectiveWidthMm: number; fitAdjustmentMm: number } => {
  if (gapCount <= 0) {
    return { gapSizesMm: [], effectiveWidthMm: stripSumMm, fitAdjustmentMm: 0 };
  }

  const nominalGapTotal = gapCount * MODULE_GAP_MM;
  const minTotal = gapCount * SPACER_GAP_MIN_MM;
  const maxTotal = gapCount * SPACER_GAP_MAX_MM;
  const gapTotalMm = Math.min(maxTotal, Math.max(minTotal, targetMm - stripSumMm));
  const gapMm = gapTotalMm / gapCount;

  return {
    gapSizesMm: Array.from({ length: gapCount }, () => gapMm),
    effectiveWidthMm: stripSumMm + gapTotalMm,
    fitAdjustmentMm: gapTotalMm - nominalGapTotal,
  };
};

const fitActionLabel = (action: FitAction): string => {
  if (action === 'tighten') return 'стянуть';
  if (action === 'relax') return 'расслабить';
  return '';
};

const resolveFitAction = (adjustmentMm: number): FitAction => {
  if (adjustmentMm < 0) return 'tighten';
  if (adjustmentMm > 0) return 'relax';
  return 'none';
};

const buildGapDetail = (gapSizesMm: number[], fitApplied: boolean): string | null => {
  if (!fitApplied || gapSizesMm.length === 0) return null;
  const minGap = Math.min(...gapSizesMm);
  const maxGap = Math.max(...gapSizesMm);
  if (Math.abs(minGap - MODULE_GAP_MM) < 0.001 && Math.abs(maxGap - MODULE_GAP_MM) < 0.001) return null;
  return `Демпфер-проставки: номинал ${MODULE_GAP_MM} мм → ${formatMm(minGap)}${Math.abs(minGap - maxGap) < 0.001 ? '' : `–${formatMm(maxGap)}`} мм.`;
};

const buildFitNote = (
  nominalWidthMm: number,
  targetWidthMm: number,
  fitAction: FitAction,
  fitActionMm: number,
  fitApplied: boolean,
  gapSizesMm: number[],
  remainderMm: number,
  withinAllowance: boolean,
): string | undefined => {
  const rawDiff = targetWidthMm - nominalWidthMm;

  if (Math.abs(rawDiff) < 0.05) return 'Габарит по планкам совпадает с заказом.';

  const limitMm = spacerFitLimitMm(gapSizesMm.length);
  const parts: string[] = [];

  if (fitAction !== 'none' && fitActionMm > 0) {
    const verb = fitActionLabel(fitAction);
    parts.push(
      fitApplied
        ? `Подогнано демпфер-проставками: ${verb} полотно на ${formatMm(fitActionMm)} мм (${formatMm(nominalWidthMm)} → ${formatMm(nominalWidthMm + (fitAction === 'relax' ? fitActionMm : -fitActionMm))} мм).`
        : `Для заказа ${formatMm(targetWidthMm)} мм: ${verb} проставки на ${formatMm(fitActionMm)} мм (по планкам ${formatMm(nominalWidthMm)} мм, зазор ${formatMm(SPACER_GAP_MIN_MM)}–${formatMm(SPACER_GAP_MAX_MM)} мм).`,
    );
  }

  const gapDetail = buildGapDetail(gapSizesMm, fitApplied);
  if (gapDetail) parts.push(gapDetail);

  if (!withinAllowance) {
    parts.push(
      `Разница ${formatMm(Math.abs(rawDiff))} мм больше хода проставок ±${formatMm(limitMm)} мм.`,
    );
    if (remainderMm !== 0) {
      parts.push(`После подгонки остаток ${formatMm(Math.abs(remainderMm))} мм — скорректируйте число профилей.`);
    }
  } else if (remainderMm === 0 && fitApplied) {
    parts.push('Монтажный габарит совпадает с заказом.');
  } else if (remainderMm !== 0) {
    parts.push(`После подгонки остаток ${formatMm(Math.abs(remainderMm))} мм.`);
  }

  return parts.join(' ');
};

/** Пояснение для чертежа: сжать или растянуть демпфер-проставки. */
export const buildDrawingFitNote = (
  _orderWidthMm: number,
  nominalWidthMm: number,
  targetWidthMm: number,
  fitAction: FitAction,
  fitActionMm: number,
  fitApplied: boolean,
  gapSizesMm: number[],
  remainderMm: number,
  withinAllowance: boolean,
): string | undefined => {
  const rawDiff = targetWidthMm - nominalWidthMm;

  if (Math.abs(rawDiff) < 0.05) return undefined;

  const limitMm = spacerFitLimitMm(gapSizesMm.length);
  const lines: string[] = [];

  if (fitAction !== 'none' && fitActionMm > 0) {
    const verb = fitActionLabel(fitAction);
    const headline = fitApplied
      ? `Подгонка под заказ ${formatMm(targetWidthMm)} мм: ${verb} проставки на ${formatMm(fitActionMm)} мм`
      : `Монтаж: ${verb} проставки на ${formatMm(fitActionMm)} мм (по планкам ${formatMm(nominalWidthMm)} мм → заказ ${formatMm(targetWidthMm)} мм)`;
    lines.push(headline);
  } else if (!withinAllowance) {
    const verb = rawDiff > 0 ? 'расслабить' : 'стянуть';
    lines.push(
      `По планкам ${formatMm(nominalWidthMm)} мм, заказ ${formatMm(targetWidthMm)} мм — ${verb} проставки на ${formatMm(Math.abs(rawDiff))} мм не укладывается в ход ±${formatMm(limitMm)} мм.`,
    );
  }

  const gapDetail = buildGapDetail(gapSizesMm, fitApplied);
  if (gapDetail) lines.push(gapDetail);

  if (remainderMm !== 0) {
    lines.push(`Остаток после подгонки: ${formatMm(Math.abs(remainderMm))} мм.`);
  } else if (fitApplied && fitActionMm > 0) {
    lines.push(`Итоговый монтажный габарит: ${formatMm(targetWidthMm)} мм.`);
  }

  lines.push(`Демпфер-проставка ${formatMm(SPACER_GAP_MIN_MM)}–${formatMm(SPACER_GAP_MAX_MM)} мм.`);

  return lines.join(' ');
};

/**
 * Подгонка длины ковра сжатием и растяжением демпфер-проставок.
 * Каждая проставка остаётся в диапазоне 4,5–5,5 мм.
 */
export const resolveLayoutDimensions = (
  strips: Strip[],
  targetWidthMm: number,
  orderWidthForAllowance: number,
  fitToOrder: boolean,
): ResolvedLayout => {
  const stripSumMm = strips.reduce((sum, strip) => sum + strip.widthMm, 0);
  const gapCount = Math.max(0, strips.length - 1);
  const nominalGapTotal = gapCount * MODULE_GAP_MM;
  const nominalWidthMm = stripSumMm + nominalGapTotal;
  const rawDelta = targetWidthMm - nominalWidthMm;
  const maxAdj = spacerFitLimitMm(gapCount);
  const recommendedAdjustmentMm = Math.max(-maxAdj, Math.min(maxAdj, rawDelta));
  const withinAllowance = Math.abs(rawDelta) <= maxAdj + 0.001;
  const fitAction = resolveFitAction(recommendedAdjustmentMm);
  const fitActionMm = Math.abs(recommendedAdjustmentMm);

  const buildResult = (
    gapSizesMm: number[],
    effectiveWidthMm: number,
    fitAdjustmentMm: number,
    fitApplied: boolean,
  ): ResolvedLayout => {
    const remainderMm = Math.round((targetWidthMm - effectiveWidthMm) * 10) / 10;
    const appliedAction = resolveFitAction(fitAdjustmentMm);
    const appliedActionMm = Math.abs(fitAdjustmentMm);

    return {
      stripSumMm,
      gapSizesMm,
      nominalWidthMm,
      effectiveWidthMm,
      remainderMm,
      fitApplied,
      fitAdjustmentMm,
      recommendedAdjustmentMm,
      fitAction: fitApplied ? appliedAction : fitAction,
      fitActionMm: fitApplied ? appliedActionMm : fitActionMm,
      isFullyFitted: Math.abs(targetWidthMm - effectiveWidthMm) < 0.05,
      fitNote: buildFitNote(
        nominalWidthMm,
        targetWidthMm,
        fitApplied ? appliedAction : fitAction,
        fitApplied ? appliedActionMm : fitActionMm,
        fitApplied,
        gapSizesMm,
        remainderMm,
        withinAllowance,
      ),
      drawingFitNote: buildDrawingFitNote(
        orderWidthForAllowance,
        nominalWidthMm,
        targetWidthMm,
        fitApplied ? appliedAction : fitAction,
        fitApplied ? appliedActionMm : fitActionMm,
        fitApplied,
        gapSizesMm,
        remainderMm,
        withinAllowance,
      ),
    };
  };

  const nominalGaps = Array(gapCount).fill(MODULE_GAP_MM);

  if (strips.length === 0) {
    return {
      stripSumMm,
      gapSizesMm: nominalGaps,
      nominalWidthMm,
      effectiveWidthMm: nominalWidthMm,
      remainderMm: Math.round((targetWidthMm - nominalWidthMm) * 10) / 10,
      fitApplied: false,
      fitAdjustmentMm: 0,
      recommendedAdjustmentMm,
      fitAction,
      fitActionMm,
      isFullyFitted: Math.abs(targetWidthMm - nominalWidthMm) < 0.05,
    };
  }

  if (!fitToOrder) {
    return buildResult(nominalGaps, nominalWidthMm, 0, false);
  }

  const fitted = fitSpacerGaps(gapCount, stripSumMm, targetWidthMm);
  const fitApplied = Math.abs(fitted.fitAdjustmentMm) > 0.001;

  return buildResult(fitted.gapSizesMm, fitted.effectiveWidthMm, fitted.fitAdjustmentMm, fitApplied);
};
