type Props = {
  x: number;
  y: number;
  width?: number;
  year?: number;
};

const SIGNATURE_LINE_COUNT = 3;
const LINE_GAP = 20;

/** Высота блока от верхней точки y до нижней линии даты. */
export const APPROVAL_BLOCK_HEIGHT = 14 + 32 + (SIGNATURE_LINE_COUNT - 1) * LINE_GAP + 10 + 14;

const ApprovalDateLine = ({ x, y, width, year }: { x: number; y: number; width: number; year: number }) => {
  const baseline = y + 1;
  const dayLineEnd = x + 30;
  const monthLineStart = dayLineEnd + 12;
  const monthLineEnd = x + width - 70;
  const yearLabel = `${year}г.`;

  return (
    <g className="approval-block__date">
      <text x={x} y={y} className="approval-block__date-text">
        "
      </text>
      <line x1={x + 7} y1={baseline} x2={dayLineEnd} y2={baseline} stroke="#111827" strokeWidth={0.75} />
      <text x={dayLineEnd + 2} y={y} className="approval-block__date-text">
        "
      </text>
      <line
        x1={monthLineStart}
        y1={baseline}
        x2={monthLineEnd}
        y2={baseline}
        stroke="#111827"
        strokeWidth={0.75}
      />
      <text x={monthLineEnd + 2} y={y} className="approval-block__date-text">
        " {yearLabel}
      </text>
      <line
        x1={monthLineEnd + 46}
        y1={baseline}
        x2={x + width}
        y2={baseline}
        stroke="#111827"
        strokeWidth={0.75}
      />
    </g>
  );
};

/** Блок согласования для технического листа (подписи и дата). */
export const ApprovalBlock = ({ x, y, width = 200, year = new Date().getFullYear() }: Props) => {
  const firstLineY = y + 32;

  return (
    <g className="approval-block">
      <text x={x} y={y + 14} className="approval-block__title">
        Согласовано:
      </text>
      {Array.from({ length: SIGNATURE_LINE_COUNT }, (_, index) => {
        const lineY = firstLineY + index * LINE_GAP;
        return (
          <line
            key={index}
            x1={x}
            y1={lineY}
            x2={x + width}
            y2={lineY}
            stroke="#111827"
            strokeWidth={0.75}
          />
        );
      })}
      <ApprovalDateLine x={x} y={firstLineY + SIGNATURE_LINE_COUNT * LINE_GAP + 10} width={width} year={year} />
    </g>
  );
};
