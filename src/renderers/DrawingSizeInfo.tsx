import type { CalculationResult, ProductConfig } from '../domain/types';
import { formatDrawingSizePair } from '../domain/dimensionLabels';
import { getCalculatedLayoutWidthMm } from './drawingSizeMetrics';

type Props = {
  x: number;
  y: number;
  config: ProductConfig;
  calculation: CalculationResult;
};

export const DrawingSizeInfo = ({ x, y, config, calculation }: Props) => {
  const requestedLine = `Запрашиваемый размер: ${formatDrawingSizePair(config.orderLengthMm, config.orderWidthMm)}`;
  const calculatedWidthMm = getCalculatedLayoutWidthMm(calculation);
  const calculatedLine = `Расчетный размер: ${formatDrawingSizePair(config.totalLengthMm, calculatedWidthMm)}`;

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
