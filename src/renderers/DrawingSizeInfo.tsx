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

const LINE_HEIGHT_MM = 6;
const FONT_SIZE = 14;

/** Запрашиваемый и расчётный размер ковра (как на эталонном чертеже). */
export const DrawingSizeInfo = ({ x, y, config, calculation, width }: Props) => {
  const calculatedWidthMm = getCalculatedLayoutWidthMm(calculation);
  const requested = formatMatSizePair(config.orderWidthMm, config.orderLengthMm);
  const calculated = formatMatSizePair(calculatedWidthMm, config.totalLengthMm);
  const maxWidth = width != null ? width - mm(2) : undefined;
  const carpetCount = calculation.carpetCount || 1;

  return (
    <g className="sheet-size-info">
      <SizeLine x={x} y={y} text={`Запрашиваемый размер ковра ${requested}`} maxWidth={maxWidth} />
      <SizeLine
        x={x}
        y={y + mm(LINE_HEIGHT_MM)}
        text={`Расчетный размер ковра ${calculated}`}
        maxWidth={maxWidth}
      />
      <SizeLine
        x={x}
        y={y + mm(LINE_HEIGHT_MM * 2)}
        text={`Кол-во: ${carpetCount} шт.`}
        maxWidth={maxWidth}
      />
    </g>
  );
};

const SizeLine = ({
  x,
  y,
  text,
  maxWidth,
}: {
  x: number;
  y: number;
  text: string;
  maxWidth?: number;
}) => {
  const estimated = text.length * FONT_SIZE * 0.55;
  const needsFit = maxWidth != null && estimated > maxWidth;

  return (
    <text
      x={x}
      y={y}
      className="eskd-text sheet-size-info__line"
      style={{ fontSize: FONT_SIZE }}
      textAnchor={maxWidth != null ? 'end' : 'start'}
      {...(needsFit ? { textLength: maxWidth, lengthAdjust: 'spacingAndGlyphs' as const } : {})}
    >
      {text}
    </text>
  );
};
