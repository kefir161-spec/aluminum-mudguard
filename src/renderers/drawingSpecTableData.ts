import type { CalculationResult, ModuleType } from '../domain/types';

type SpecRow = {
  label: string;
  count: number;
};

const PLANK_ORDER: ModuleType[] = ['rubber', 'brush', 'pile', 'scraper'];

const plankLabel = (shortName: string): string => `Планка "${shortName}"`;

export const buildSpecRows = (calculation: CalculationResult, cableCount: number): SpecRow[] => {
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
    rows.push({ label: 'Трос', count: cableCount });
  }
  rows.push({ label: 'Втулка', count: calculation.bushingCount });

  return rows;
};

export const buildDrawingFitLine = (calculation: CalculationResult): string | undefined => {
  if (!calculation.fitToOrderSize) return undefined;

  const fromWidthMm = Math.round(calculation.nominalLayoutWidthMm);
  const toWidthMm = Math.round(
    calculation.fitApplied ? calculation.effectiveLayoutWidthMm : calculation.orderTargetWidthMm,
  );

  if (fromWidthMm === toWidthMm) return undefined;

  const verb = toWidthMm > fromWidthMm ? 'расслабить' : 'стянуть';
  const adjustmentMm =
    calculation.fitActionMm > 0 ? calculation.fitActionMm : Math.abs(toWidthMm - fromWidthMm);

  return `Подгонка натяжением тросов: ${verb} полотно на ${adjustmentMm} мм.`;
};
