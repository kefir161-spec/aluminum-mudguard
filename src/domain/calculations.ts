import { computeCableLayout } from './cableLayout';
import { moduleTypeOrder } from './moduleDefinitions';
import { computeGapTotal, countBushings, countPlugs } from './layoutRules';
import { getCompressionAllowance, isWithinCompressionAllowance } from './compression';
import { resolveLayoutDimensions } from './gapFit';
import { getOrderTargetDimensions } from './pitDimensions';
import type { CalculationResult, ProductConfig, Strip } from './types';
import { getNarrowWidthDiscount, pricingConfig } from './pricing';

export const MM2_TO_M2 = 1_000_000;

const stripAreaM2 = (strip: Strip, totalLengthMm: number): number =>
  (strip.widthMm * totalLengthMm) / MM2_TO_M2;

export const calculateConfig = (config: ProductConfig): CalculationResult => {
  const orderTarget = getOrderTargetDimensions(config);
  const fitToOrderSize = config.fitToOrderSize ?? false;
  const resolved = resolveLayoutDimensions(
    config.strips,
    orderTarget.totalWidthMm,
    orderTarget.totalWidthMm,
    fitToOrderSize,
  );

  const totalStripWidthMm = config.strips.reduce((sum, strip) => sum + strip.widthMm, 0);
  const totalGapMm = computeGapTotal(config.strips.length);
  const totalLayoutWidthMm = resolved.nominalWidthMm;
  const effectiveLayoutWidthMm = resolved.effectiveWidthMm;
  const totalAreaM2 = (effectiveLayoutWidthMm * config.totalLengthMm) / MM2_TO_M2;
  const cableLayout = computeCableLayout(config.totalLengthMm);

  const byType = moduleTypeOrder.map((type): CalculationResult['byType'][number] => {
    const strips = config.strips.filter((strip) => strip.type === type);
    const areaM2 = strips.reduce((sum, strip) => sum + stripAreaM2(strip, config.totalLengthMm), 0);
    const unitPrice =
      pricingConfig.mode === 'per_m2'
        ? pricingConfig.modulePricesPerM2[type]
        : pricingConfig.modulePricesPerLinearMeter[type];
    const price =
      pricingConfig.mode === 'per_m2'
        ? areaM2 * unitPrice
        : strips.reduce((sum, strip) => sum + (strip.widthMm / 1000) * unitPrice, 0);
    return {
      type,
      count: strips.length,
      totalWidthMm: strips.reduce((sum, strip) => sum + strip.widthMm, 0),
      areaM2,
      percentage: totalAreaM2 > 0 ? (areaM2 / totalAreaM2) * 100 : 0,
      unitPrice,
      price,
    };
  });

  const widthDeltaMm = Math.round(effectiveLayoutWidthMm) - Math.round(orderTarget.totalWidthMm);
  const compressionAllowance = getCompressionAllowance(orderTarget.totalWidthMm);
  const subtotalPrice = byType.reduce((sum, item) => sum + item.price, 0);
  const narrowWidthDiscount = getNarrowWidthDiscount(
    config.narrowWidthDiscountEnabled ?? false,
    orderTarget.totalLengthMm,
    subtotalPrice,
  );

  return {
    totalAreaM2,
    subtotalPrice,
    narrowWidthDiscountApplied: narrowWidthDiscount.applied,
    narrowWidthDiscountPercent: narrowWidthDiscount.percent,
    narrowWidthDiscountAmount: narrowWidthDiscount.amount,
    totalPrice: subtotalPrice - narrowWidthDiscount.amount,
    totalStripWidthMm,
    totalLayoutWidthMm,
    totalGapMm,
    byType,
    isUnderfilled: resolved.remainderMm > 0,
    isOverfilled: resolved.remainderMm < 0,
    widthDeltaMm,
    plugCount: countPlugs(config.strips),
    bushingCount: countBushings(config.strips.length, cableLayout?.count ?? 0),
    cableLayout,
    compressionAllowance,
    isWithinCompression: isWithinCompressionAllowance(
      resolved.nominalWidthMm - orderTarget.totalWidthMm,
      orderTarget.totalWidthMm,
    ),
    orderTargetWidthMm: orderTarget.totalWidthMm,
    orderTargetLengthMm: orderTarget.totalLengthMm,
    fitToOrderSize,
    fitApplied: resolved.fitApplied,
    fitAdjustmentMm: resolved.fitAdjustmentMm,
    fitAction: resolved.fitAction,
    fitActionMm: resolved.fitActionMm,
    gapSizesMm: resolved.gapSizesMm,
    effectiveLayoutWidthMm,
    nominalLayoutWidthMm: resolved.nominalWidthMm,
    remainderMm: resolved.remainderMm,
    isFullyFitted: resolved.isFullyFitted,
    fitNote: resolved.fitNote,
    drawingFitNote: resolved.drawingFitNote,
  };
};

export const formatMoney = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);

export const formatNumber = (value: number, fractionDigits = 2): string =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value);
