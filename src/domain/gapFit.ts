import { MODULE_GAP_MM } from './constants';
import { getCompressionAllowance } from './compression';
import { formatAllowance } from './formatAllowance';
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

const distributeIntegerTotal = (total: number, count: number): number[] => {
  if (count <= 0) return [];
  const safeTotal = Math.max(0, Math.round(total));
  const base = Math.floor(safeTotal / count);
  const extra = safeTotal - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < extra ? 1 : 0));
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
  if (minGap === MODULE_GAP_MM && maxGap === MODULE_GAP_MM) return null;
  return `Зазоры между планками: номинал ${MODULE_GAP_MM} мм → ${minGap}${minGap === maxGap ? '' : `–${maxGap}`} мм.`;
};

const buildFitNote = (
  orderWidthMm: number,
  nominalWidthMm: number,
  targetWidthMm: number,
  fitAction: FitAction,
  fitActionMm: number,
  fitApplied: boolean,
  gapSizesMm: number[],
  remainderMm: number,
  withinAllowance: boolean,
): string | undefined => {
  const nominal = Math.round(nominalWidthMm);
  const order = Math.round(targetWidthMm);
  const rawDiff = order - nominal;

  if (rawDiff === 0) return 'Габарит по планкам совпадает с заказом.';

  const allowance = getCompressionAllowance(orderWidthMm);
  const parts: string[] = [];

  if (fitAction !== 'none' && fitActionMm > 0) {
    const verb = fitActionLabel(fitAction);
    parts.push(
      fitApplied
        ? `Подогнано натяжением тросов: ${verb} полотно на ${fitActionMm} мм (${nominal} → ${order} мм).`
        : `Для заказа ${order} мм: ${verb} полотно (тросы) на ${fitActionMm} мм (по планкам ${nominal} мм, допуск ${formatAllowance(allowance.minMm, allowance.maxMm)}).`,
    );
  }

  const gapDetail = buildGapDetail(gapSizesMm, fitApplied);
  if (gapDetail) parts.push(gapDetail);

  if (!withinAllowance) {
    parts.push(
      `Разница ${Math.abs(rawDiff)} мм превышает допуск натяжения тросов ${formatAllowance(allowance.minMm, allowance.maxMm)} при ширине ${Math.round(orderWidthMm)} мм.`,
    );
    if (remainderMm !== 0) {
      parts.push(`После подгонки остаток ${Math.abs(remainderMm)} мм — скорректируйте число профилей.`);
    }
  } else if (remainderMm === 0 && fitApplied) {
    parts.push('Монтажный габарит совпадает с заказом.');
  } else if (remainderMm !== 0) {
    parts.push(`После подгонки остаток ${Math.abs(remainderMm)} мм.`);
  }

  return parts.join(' ');
};

/** Пояснение для чертежа: стянуть / расслабить полотно тросами на N мм. */
export const buildDrawingFitNote = (
  orderWidthMm: number,
  nominalWidthMm: number,
  targetWidthMm: number,
  fitAction: FitAction,
  fitActionMm: number,
  fitApplied: boolean,
  gapSizesMm: number[],
  remainderMm: number,
  withinAllowance: boolean,
): string | undefined => {
  const nominal = Math.round(nominalWidthMm);
  const order = Math.round(targetWidthMm);
  const rawDiff = order - nominal;

  if (rawDiff === 0) return undefined;

  const allowance = getCompressionAllowance(orderWidthMm);
  const lines: string[] = [];

  if (fitAction !== 'none' && fitActionMm > 0) {
    const verb = fitActionLabel(fitAction);
    const headline = fitApplied
      ? `Подгонка под заказ ${order} мм: ${verb} полотно (тросы) на ${fitActionMm} мм`
      : `Монтаж: ${verb} полотно (тросы) на ${fitActionMm} мм (по планкам ${nominal} мм → заказ ${order} мм)`;
    lines.push(headline);
  } else if (!withinAllowance) {
    const verb = rawDiff > 0 ? 'расслабить' : 'стянуть';
    lines.push(
      `По планкам ${nominal} мм, заказ ${order} мм — ${verb} полотно (тросы) на ${Math.abs(rawDiff)} мм не укладывается в допуск ${formatAllowance(allowance.minMm, allowance.maxMm)}.`,
    );
  }

  const gapDetail = buildGapDetail(gapSizesMm, fitApplied);
  if (gapDetail) lines.push(gapDetail);

  if (remainderMm !== 0) {
    lines.push(`Остаток после подгонки: ${Math.abs(remainderMm)} мм.`);
  } else if (fitApplied && fitActionMm > 0) {
    lines.push(`Итоговый монтажный габарит: ${order} мм.`);
  }

  lines.push(
    `Допуск натяжения тросов по ширине ${Math.round(orderWidthMm)} мм: ${formatAllowance(allowance.minMm, allowance.maxMm)}. Полотно прошито тросами по всей длине.`,
  );

  return lines.join(' ');
};

/**
 * Подгонка под заказ: перераспределение целочисленных зазоров между планками
 * (модель натяжения/расслабления полотна тросами).
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
  const roundedTarget = Math.round(targetWidthMm);
  const roundedNominal = Math.round(nominalWidthMm);
  const rawDelta = roundedTarget - roundedNominal;

  const allowance = getCompressionAllowance(orderWidthForAllowance);
  const maxAdj = Math.round(allowance.maxMm);
  const recommendedAdjustmentMm = Math.max(-maxAdj, Math.min(maxAdj, rawDelta));
  const withinAllowance = Math.abs(rawDelta) <= maxAdj;
  const fitAction = resolveFitAction(recommendedAdjustmentMm);
  const fitActionMm = Math.abs(recommendedAdjustmentMm);

  const buildResult = (
    gapSizesMm: number[],
    effectiveWidthMm: number,
    fitAdjustmentMm: number,
    fitApplied: boolean,
  ): ResolvedLayout => {
    const remainderMm = roundedTarget - Math.round(effectiveWidthMm);
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
      isFullyFitted: remainderMm === 0,
      fitNote: buildFitNote(
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
      remainderMm: roundedTarget - roundedNominal,
      fitApplied: false,
      fitAdjustmentMm: 0,
      recommendedAdjustmentMm,
      fitAction,
      fitActionMm,
      isFullyFitted: roundedTarget === roundedNominal,
    };
  }

  if (!fitToOrder) {
    return buildResult(nominalGaps, nominalWidthMm, 0, false);
  }

  let fitAdjustmentMm = recommendedAdjustmentMm;
  let gapSizesMm = [...nominalGaps];

  if (gapCount > 0) {
    let newGapTotal = nominalGapTotal + fitAdjustmentMm;
    if (newGapTotal < 0) {
      fitAdjustmentMm = -nominalGapTotal;
      newGapTotal = 0;
    }
    gapSizesMm = distributeIntegerTotal(newGapTotal, gapCount);
  }

  const effectiveWidthMm = stripSumMm + gapSizesMm.reduce((sum, gap) => sum + gap, 0);
  const fitApplied = fitAdjustmentMm !== 0;

  return buildResult(gapSizesMm, effectiveWidthMm, fitAdjustmentMm, fitApplied);
};
