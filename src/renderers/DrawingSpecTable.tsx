import { useLayoutEffect, useRef } from 'react';
import type { CalculationResult } from '../domain/types';
import {
  FIT_LINE_BOX_H,
  FIT_LINE_PAD_X,
  FIT_LINE_PAD_Y,
  measureFitLineBadgeWidth,
} from './fitLineBadge';
import { buildDrawingFitLine, buildSpecRows } from './drawingSpecTableData';

type Props = {
  x: number;
  y: number;
  calculation: CalculationResult;
  cableCount: number;
};

const COL1_W = 280;
const COL2_W = 120;
const ROW_H = 22;
export const SPEC_TABLE_WIDTH = COL1_W + COL2_W;
const TABLE_W = SPEC_TABLE_WIDTH;
const FitLineBadge = ({ x, y, text }: { x: number; y: number; text: string }) => {
  const textRef = useRef<SVGTextElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  const textY = y + FIT_LINE_PAD_Y + 16;

  useLayoutEffect(() => {
    const textEl = textRef.current;
    const rectEl = rectRef.current;
    if (!textEl || !rectEl) return;
    rectEl.setAttribute('width', String(measureFitLineBadgeWidth(textEl)));
  }, [text]);

  return (
    <g className="sheet-spec-fit">
      <rect
        ref={rectRef}
        x={x}
        y={y}
        width={1}
        height={FIT_LINE_BOX_H}
        fill="#fffbeb"
        stroke="#d97706"
        strokeWidth={1}
        rx={4}
      />
      <text ref={textRef} x={x + FIT_LINE_PAD_X} y={textY} className="sheet-spec-fit-line">
        {text}
      </text>
    </g>
  );
};

export const DrawingSpecTable = ({ x, y, calculation, cableCount }: Props) => {
  const rows = buildSpecRows(calculation, cableCount);
  const fitLine = buildDrawingFitLine(calculation);
  const headerH = ROW_H;
  const bodyH = rows.length * ROW_H;
  const tableH = headerH + bodyH;

  return (
    <g className="sheet-spec-table">
      <rect x={x} y={y} width={TABLE_W} height={tableH} fill="#fff" stroke="#111827" strokeWidth={1} />
      <line x1={x} y1={y + headerH} x2={x + TABLE_W} y2={y + headerH} stroke="#111827" strokeWidth={0.75} />
      <line x1={x + COL1_W} y1={y} x2={x + COL1_W} y2={y + tableH} stroke="#111827" strokeWidth={0.75} />

      <text x={x + 8} y={y + 15} className="sheet-spec-cell sheet-spec-cell--head">
        Комплектация
      </text>
      <text x={x + COL1_W + 8} y={y + 15} className="sheet-spec-cell sheet-spec-cell--head">
        Количество, шт
      </text>

      {rows.map((row, index) => {
        const rowY = y + headerH + index * ROW_H;
        return (
          <g key={row.label}>
            {index > 0 && (
              <line x1={x} y1={rowY} x2={x + TABLE_W} y2={rowY} stroke="#111827" strokeWidth={0.5} />
            )}
            <text x={x + 8} y={rowY + 15} className="sheet-spec-cell">
              {row.label}
            </text>
            <text x={x + COL1_W + COL2_W - 10} y={rowY + 15} textAnchor="end" className="sheet-spec-cell">
              {row.count}
            </text>
          </g>
        );
      })}

      {fitLine && <FitLineBadge x={x} y={y + tableH + 10} text={fitLine} />}
    </g>
  );
};
