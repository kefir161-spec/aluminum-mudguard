import type { CableLayout, CableLayoutMode } from './cableLayout';
import type { CompressionAllowance } from './compression';
import type { FitAction } from './gapFit';

export type ModuleType = 'rubber' | 'pile' | 'brush' | 'scraper';

export type TextureType = 'ribbed' | 'fiber' | 'bristles' | 'metal';

export type DimensionSource = 'carpet' | 'pit';

/** Исполнение алюминиевого профиля: определяет цену по прайсу. */
export type ProfileGrade = 'standard' | 'reinforced';

/** Величина в рублях, посчитанная для каждого исполнения профиля. */
export type GradedPrice = Record<ProfileGrade, number>;

export type ModuleDefinition = {
  id: ModuleType;
  name: string;
  shortName: string;
  description: string;
  defaultColor: string;
  textureType: TextureType;
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
  /** Комментарий заказчика/менеджера — выводится в левом нижнем углу чертежа. */
  drawingComment?: string;
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
  /** Число одинаковых ковров в заказе. */
  carpetCount?: number;
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
  modulePricesPerM2: Record<ProfileGrade, Record<ModuleType, number>>;
  modulePricesPerLinearMeter: Record<ModuleType, number>;
};

export type CalculationByType = {
  type: ModuleType;
  count: number;
  totalWidthMm: number;
  areaM2: number;
  percentage: number;
  unitPrice: GradedPrice;
  price: GradedPrice;
};

export type CalculationResult = {
  totalAreaM2: number;
  subtotalPrice: GradedPrice;
  narrowWidthDiscountApplied: boolean;
  narrowWidthDiscountPercent: number;
  narrowWidthDiscountAmount: GradedPrice;
  totalPrice: GradedPrice;
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
  /** Число одинаковых ковров, на которое умножен расчёт. */
  carpetCount: number;
  fitNote?: string;
  drawingFitNote?: string;
};
