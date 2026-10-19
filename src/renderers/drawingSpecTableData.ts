import type { CalculationResult, ModuleType } from '../domain/types';

type SpecRow = {
  label: string;
  count: number;
};

const PLANK_ORDER: ModuleType[] = ['rubber', 'brush', 'pile', 'scraper'];

const plankLabel = (shortName: string): string => `Планка "${shortName}"`;

export const buildSpecRows = (calculation: CalculationResult, cableCount: number): SpecRow[] => {
  const qty = Math.max(1, calculation.carpetCount);
  const rows: SpecRow[] = [];

  for (const type of PLANK_ORDER) {
    const count = calculation.byType.find((row) => row.type === type)?.count ?? 0;
    if (count <= 0) continue;
    const shortName =
      type === 'rubber' ? 'Резина' : type === 'brush' ? 'Щетка' : type === 'pile' ? 'Ворс' : 'Скребок';
    rows.push({ label: plankLabel(shortName), count });
  }

  rows.push({ label: 'Заглушка', count: calculation.plugCount });
  if (cableCount > 0) {
    rows.push({ label: 'Трос', count: cableCount * qty });
  }
  rows.push({ label: 'Втулка', count: calculation.bushingCount });
  if (calculation.kantEnabled) {
    rows.push({ label: 'Кант (обрамление)', count: 4 * qty });
  }

  return rows;
};

export const buildDrawingFitLine = (calculation: CalculationResult): string | undefined => {
  if (!calculation.fitToOrderSize) return undefined;

  if (!calculation.fitApplied) return undefined;
  if (Math.abs(calculation.effectiveLayoutWidthMm - calculation.nominalLayoutWidthMm) < 0.05) return undefined;

  const verb = calculation.effectiveLayoutWidthMm > calculation.nominalLayoutWidthMm ? 'расслабить' : 'стянуть';
  const adjustmentMm = calculation.fitActionMm;
  const rounded = Math.round(adjustmentMm * 10) / 10;
  const amount = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');

  return `Подгонка демпфер-проставками: ${verb} полотно на ${amount} мм.`;
};
