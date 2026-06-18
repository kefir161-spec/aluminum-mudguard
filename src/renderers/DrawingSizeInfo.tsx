import type { CalculationResult, ProductConfig } from '../domain/types';
import {
  dimensionSourceLabel,
  formatCompactDrawingSizePair,
} from '../domain/dimensionLabels';
import { getCalculatedLayoutWidthMm } from './drawingSizeMetrics';

type Props = {
  x: number;
  y: number;
  config: ProductConfig;
  calculation: CalculationResult;
};

const LINE_HEIGHT = 18;

type InfoRow = {
  label: string;
  value: string;
};

const SizeInfoRow = ({ x, y, row }: { x: number; y: number; row: InfoRow }) => (
  <text x={x} y={y} className="sheet-size-info__line">
    <tspan className="sheet-size-info__label">{row.label}: </tspan>
    <tspan>{row.value}</tspan>
    <title>{`${row.label}: ${row.value}`}</title>
  </text>
);

export const DrawingSizeInfo = ({ x, y, config, calculation }: Props) => {
  const calculatedWidthMm = getCalculatedLayoutWidthMm(calculation);
  const rows: InfoRow[] = [
    { label: 'Источник', value: dimensionSourceLabel(config.dimensionSource) },
    {
      label: 'Запрос',
      value: formatCompactDrawingSizePair(config.orderLengthMm, config.orderWidthMm),
    },
    {
      label: 'Расчёт',
      value: formatCompactDrawingSizePair(config.totalLengthMm, calculatedWidthMm),
    },
  ];

  return (
    <g className="sheet-size-info">
      {rows.map((row, index) => (
        <SizeInfoRow key={row.label} x={x} y={y + index * LINE_HEIGHT} row={row} />
      ))}
    </g>
  );
};
