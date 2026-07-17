import { LINE_THICK_PX, LINE_THIN_PX, mm } from '../domain/eskd';
import type { CalculationResult } from '../domain/types';
import { buildDrawingFitLine, buildSpecRows } from './drawingSpecTableData';

type Props = {
  x: number;
  y: number;
  calculation: CalculationResult;
  cableCount: number;
};

const COL1_W = mm(54);
const COL2_W = mm(20);
const ROW_H = mm(8.5);
const HEADER_H = mm(9);
const CELL_PAD = mm(1.2);

export const SPEC_TABLE_WIDTH_MM = 74;
export const SPEC_TABLE_WIDTH = COL1_W + COL2_W;

export const computeSpecHeight = (rowCount: number): number => HEADER_H + rowCount * ROW_H;

const FONT_HEAD = 14;
const FONT_CELL = 14;

const estimateTextWidth = (text: string, size: number): number => text.length * size * 0.55;

const FitText = ({
  x,
  y,
  text,
  size,
  maxWidth,
  anchor = 'start',
  className,
}: {
  x: number;
  y: number;
  text: string;
  size: number;
  maxWidth: number;
  anchor?: 'start' | 'middle' | 'end';
  className?: string;
}) => {
  const needsFit = estimateTextWidth(text, size) > maxWidth;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      className={className ?? 'eskd-text'}
      style={{ fontSize: size }}
      {...(needsFit ? { textLength: maxWidth, lengthAdjust: 'spacingAndGlyphs' as const } : {})}
    >
      {text}
    </text>
  );
};

/** Таблица комплектации (как на эталонном чертеже). */
export const DrawingSpecTable = ({ x, y, calculation, cableCount }: Props) => {
  const rows = buildSpecRows(calculation, cableCount);
  const fitLine = buildDrawingFitLine(calculation);
  const tableW = SPEC_TABLE_WIDTH;
  const tableH = computeSpecHeight(rows.length);
  const col1Max = COL1_W - CELL_PAD * 2;
  const col2Max = COL2_W - CELL_PAD * 2;

  const fitColon = fitLine?.indexOf(': ') ?? -1;
  const fitLine1 = fitLine && fitColon >= 0 ? fitLine.slice(0, fitColon + 1) : fitLine;
  const fitLine2 = fitLine && fitColon >= 0 ? fitLine.slice(fitColon + 2) : undefined;
  const fitMax = tableW - mm(1);
  const fitFont = 12;
  const fitY = y + tableH + mm(4.5);

  return (
    <g className="sheet-spec-table">
      <rect x={x} y={y} width={tableW} height={tableH} fill="#fff" stroke="#000" strokeWidth={LINE_THICK_PX} />
      <line x1={x} y1={y + HEADER_H} x2={x + tableW} y2={y + HEADER_H} stroke="#000" strokeWidth={LINE_THIN_PX} />
      <line x1={x + COL1_W} y1={y} x2={x + COL1_W} y2={y + tableH} stroke="#000" strokeWidth={LINE_THIN_PX} />

      <FitText
        x={x + CELL_PAD}
        y={y + HEADER_H / 2}
        text="Комплектация"
        size={FONT_HEAD}
        maxWidth={col1Max}
        className="eskd-text sheet-spec-cell--head"
      />
      <FitText
        x={x + COL1_W + COL2_W / 2}
        y={y + HEADER_H / 2}
        text="шт"
        size={FONT_HEAD}
        maxWidth={col2Max}
        anchor="middle"
        className="eskd-text sheet-spec-cell--head"
      />

      {rows.map((row, index) => {
        const rowY = y + HEADER_H + index * ROW_H;
        const textY = rowY + ROW_H / 2;
        return (
          <g key={row.label}>
            {index > 0 && (
              <line x1={x} y1={rowY} x2={x + tableW} y2={rowY} stroke="#000" strokeWidth={LINE_THIN_PX} />
            )}
            <FitText x={x + CELL_PAD} y={textY} text={row.label} size={FONT_CELL} maxWidth={col1Max} />
            <FitText
              x={x + COL1_W + COL2_W - CELL_PAD}
              y={textY}
              text={String(row.count)}
              size={FONT_CELL}
              maxWidth={col2Max}
              anchor="end"
            />
          </g>
        );
      })}

      {fitLine1 && (
        <g className="sheet-spec-fit">
          <FitText
            x={x}
            y={fitY}
            text={fitLine1}
            size={fitFont}
            maxWidth={fitMax}
            className="eskd-text sheet-spec-fit-line"
          />
          {fitLine2 && (
            <FitText
              x={x}
              y={fitY + mm(4.5)}
              text={fitLine2}
              size={fitFont}
              maxWidth={fitMax}
              className="eskd-text sheet-spec-fit-line"
            />
          )}
        </g>
      )}
    </g>
  );
};
