import type { CalculationResult, ProductConfig } from '../domain/types';
import { getCalculatedLayoutWidthMm } from './drawingSizeMetrics';

type Props = {
  x: number;
  y: number;
  config: ProductConfig;
  calculation: CalculationResult;
};

const formatSizePair = (widthMm: number, lengthMm: number): string =>
  `${Math.round(widthMm)}х${Math.round(lengthMm)}мм.`;

export const DrawingSizeInfo = ({ x, y, config, calculation }: Props) => {
  const requestedLine = `Запрашиваемый размер ${formatSizePair(config.orderWidthMm, config.orderLengthMm)}`;
  const calculatedWidthMm = getCalculatedLayoutWidthMm(calculation);
  const calculatedLine = `Расчетный размер ${formatSizePair(calculatedWidthMm, config.totalLengthMm)}`;

  return (
    <g className="sheet-size-info">
      <text x={x} y={y} className="sheet-size-info__line">
        {requestedLine}
      </text>
      <text x={x} y={y + 20} className="sheet-size-info__line">
        {calculatedLine}
      </text>
    </g>
  );
};
