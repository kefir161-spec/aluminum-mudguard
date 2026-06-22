import type { CableLayout, CableLayoutMode } from './cableLayout';
import type { CompressionAllowance } from './compression';
import type { FitAction } from './gapFit';

export type ModuleType = 'rubber' | 'pile' | 'brush' | 'scraper';

export type TextureType = 'ribbed' | 'fiber' | 'bristles' | 'metal';

export type DimensionSource = 'carpet' | 'pit';

export type ModuleDefinition = {
  id: ModuleType;
  name: string;
  shortName: string;
  description: string;
  defaultColor: string;
  textureType: TextureType;
  pricePerM2: number;
  pricePerLinearMeter?: number;
};

export type Strip = {
  id: string;
  type: ModuleType;
  widthMm: number;
  note?: string;
};

export type ProductConfig = {
  id: string;
  projectName: string;
  clientName?: string;
  managerName?: string;
  /** Заказной размер (ковёр или приямок — см. dimensionSource). */
  orderWidthMm: number;
  orderLengthMm: number;
  /** Эффективный размер ковра после вычета 10 мм для приямка. */
  totalWidthMm: number;
  totalLengthMm: number;
  dimensionSource: DimensionSource;
  defaultStripWidthMm: number;
  layoutPattern?: ModuleType[];
  /** После автозаполнения — пересчитывать раскладку при смене ширины ковра. */
  autoFillEnabled?: boolean;
  cableLayoutMode?: CableLayoutMode;
  /** Ручной режим: число тросов вдоль длины ковра. */
  manualCableCount?: number;
  /** Ручной режим: шаг между тросами, мм. */
  manualCableSpacingMm?: number;
  cableEdgeOffsetMm?: number;
  /** Подогнать полотно под заказной габарит натяжением тросов (зазоры между планками). */
  fitToOrderSize?: boolean;
  /** Скидка −10 % при ширине ковра менее 1200 мм (только если включена вручную). */
  narrowWidthDiscountEnabled?: boolean;
  strips: Strip[];
  createdAt: string;
  updatedAt: string;
};

export type LayoutPreset = {
  id: string;
  name: string;
  description: string;
  pattern: ModuleType[];
};

export type PricingConfig = {
  mode: 'per_m2' | 'per_linear_meter';
  modulePricesPerM2: Record<ModuleType, number>;
  modulePricesPerLinearMeter: Record<ModuleType, number>;
};

export type CalculationByType = {
  type: ModuleType;
  count: number;
  totalWidthMm: number;
  areaM2: number;
  percentage: number;
  unitPrice: number;
  price: number;
};

export type CalculationResult = {
  totalAreaM2: number;
  subtotalPrice: number;
  narrowWidthDiscountApplied: boolean;
  narrowWidthDiscountPercent: number;
  narrowWidthDiscountAmount: number;
  totalPrice: number;
  totalStripWidthMm: number;
  totalLayoutWidthMm: number;
  totalGapMm: number;
  byType: CalculationByType[];
  isUnderfilled: boolean;
  isOverfilled: boolean;
  widthDeltaMm: number;
  plugCount: number;
  bushingCount: number;
  cableLayout: CableLayout | null;
  compressionAllowance: CompressionAllowance;
  isWithinCompression: boolean;
  orderTargetWidthMm: number;
  orderTargetLengthMm: number;
  fitToOrderSize: boolean;
  fitApplied: boolean;
  fitAdjustmentMm: number;
  fitAction: FitAction;
  fitActionMm: number;
  gapSizesMm: number[];
  effectiveLayoutWidthMm: number;
  nominalLayoutWidthMm: number;
  remainderMm: number;
  isFullyFitted: boolean;
  fitNote?: string;
  drawingFitNote?: string;
};
