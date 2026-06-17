import type { CalculationResult, ProductConfig } from '../domain/types';
import { getCalculatedLayoutWidthMm } from './drawingSizeMetrics';

type Props = {
  x: number;
  y: number;
  config: ProductConfig;
  calculation: CalculationResult;
};

/** Ширина — горизонталь (длина профиля), длина — вертикаль (ширина полотна). */
const formatSizePair = (profileLengthMm: number, layoutLengthMm: number): string =>
  `Ширина ${Math.round(profileLengthMm)} х Длина ${Math.round(layoutLengthMm)} мм`;

export const DrawingSizeInfo = ({ x, y, config, calculation }: Props) => {
  const requestedLine = `Запрашиваемый размер: ${formatSizePair(config.orderLengthMm, config.orderWidthMm)}`;
  const calculatedWidthMm = getCalculatedLayoutWidthMm(calculation);
  const calculatedLine = `Расчетный размер: ${formatSizePair(config.totalLengthMm, calculatedWidthMm)}`;

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
