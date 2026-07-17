import type { CalculationResult, ProductConfig } from '../domain/types';
import { formatMatSizePair } from '../domain/dimensionLabels';
import { mm } from '../domain/eskd';
import { getCalculatedLayoutWidthMm } from './drawingSizeMetrics';

type Props = {
  x: number;
  y: number;
  config: ProductConfig;
  calculation: CalculationResult;
  width?: number;
};

const LINE_HEIGHT_MM = 5;

/** Запрашиваемый и расчётный размер ковра (как на эталонном чертеже). */
export const DrawingSizeInfo = ({ x, y, config, calculation, width }: Props) => {
  const calculatedWidthMm = getCalculatedLayoutWidthMm(calculation);
  const requested = formatMatSizePair(config.orderWidthMm, config.orderLengthMm);
  const calculated = formatMatSizePair(calculatedWidthMm, config.totalLengthMm);

  return (
    <g className="sheet-size-info">
      <text
        x={x}
        y={y}
        className="eskd-text sheet-size-info__line"
        style={{ fontSize: 11 }}
        textAnchor={width ? 'end' : 'start'}
      >
        Запрашиваемый размер ковра {requested}
      </text>
      <text
        x={x}
        y={y + mm(LINE_HEIGHT_MM)}
        className="eskd-text sheet-size-info__line"
        style={{ fontSize: 11 }}
        textAnchor={width ? 'end' : 'start'}
      >
        Расчетный размер ковра {calculated}
      </text>
    </g>
  );
};
