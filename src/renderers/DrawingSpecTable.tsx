import { LINE_THICK_PX, LINE_THIN_PX, mm } from '../domain/eskd';
import type { CalculationResult } from '../domain/types';
import { buildDrawingFitLine, buildSpecRows } from './drawingSpecTableData';

type Props = {
  x: number;
  y: number;
  calculation: CalculationResult;
  cableCount: number;
};

const COL1_W = mm(52);
const COL2_W = mm(22);
const ROW_H = mm(7);
const HEADER_H = mm(8);

export const SPEC_TABLE_WIDTH_MM = 74;
export const SPEC_TABLE_WIDTH = COL1_W + COL2_W;

export const computeSpecHeight = (rowCount: number): number => HEADER_H + rowCount * ROW_H;

const FONT_HEAD = 10;
const FONT_CELL = 10;

/** Таблица комплектации (как на эталонном чертеже). */
export const DrawingSpecTable = ({ x, y, calculation, cableCount }: Props) => {
  const rows = buildSpecRows(calculation, cableCount);
  const fitLine = buildDrawingFitLine(calculation);
  const tableW = SPEC_TABLE_WIDTH;
  const tableH = computeSpecHeight(rows.length);

  return (
    <g className="sheet-spec-table">
      <rect x={x} y={y} width={tableW} height={tableH} fill="#fff" stroke="#000" strokeWidth={LINE_THICK_PX} />
      <line x1={x} y1={y + HEADER_H} x2={x + tableW} y2={y + HEADER_H} stroke="#000" strokeWidth={LINE_THIN_PX} />
      <line x1={x + COL1_W} y1={y} x2={x + COL1_W} y2={y + tableH} stroke="#000" strokeWidth={LINE_THIN_PX} />

      <text
        x={x + mm(2)}
        y={y + HEADER_H / 2}
        dominantBaseline="middle"
        className="eskd-text sheet-spec-cell--head"
        style={{ fontSize: FONT_HEAD }}
      >
        Комплектация
      </text>
      <text
        x={x + COL1_W + mm(2)}
        y={y + HEADER_H / 2}
        dominantBaseline="middle"
        className="eskd-text sheet-spec-cell--head"
        style={{ fontSize: FONT_HEAD }}
      >
        шт
      </text>

      {rows.map((row, index) => {
        const rowY = y + HEADER_H + index * ROW_H;
        const textY = rowY + ROW_H / 2;
        return (
          <g key={row.label}>
            {index > 0 && (
              <line x1={x} y1={rowY} x2={x + tableW} y2={rowY} stroke="#000" strokeWidth={LINE_THIN_PX} />
            )}
            <text
              x={x + mm(2)}
              y={textY}
              dominantBaseline="middle"
              className="eskd-text"
              style={{ fontSize: FONT_CELL }}
            >
              {row.label}
            </text>
            <text
              x={x + COL1_W + COL2_W - mm(2)}
              y={textY}
              textAnchor="end"
              dominantBaseline="middle"
              className="eskd-text"
              style={{ fontSize: FONT_CELL }}
            >
              {row.count}
            </text>
          </g>
        );
      })}

      {fitLine && (
        <text x={x} y={y + tableH + mm(5)} className="eskd-text sheet-spec-fit-line" style={{ fontSize: 10 }}>
          {fitLine}
        </text>
      )}
    </g>
  );
};
