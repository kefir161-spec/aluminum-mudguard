import { LINE_THIN_PX, mm } from '../domain/eskd';

type Props = {
  x: number;
  y: number;
  width?: number;
  year?: number;
};

const SIGNATURE_LINE_COUNT = 3;
const LINE_GAP_MM = 6;

/** Высота блока «Согласовано» от верхней точки y до нижней линии даты, мм. */
export const APPROVAL_BLOCK_HEIGHT_MM = 8 + SIGNATURE_LINE_COUNT * LINE_GAP_MM + 8 + 5;

const ApprovalDateLine = ({ x, y, width, year }: { x: number; y: number; width: number; year: number }) => {
  const baseline = y + 1;
  const dayLineEnd = x + mm(10);
  const monthLineStart = dayLineEnd + mm(4);
  const monthLineEnd = x + width - mm(24);
  const yearLabel = `${year}г.`;

  return (
    <g className="approval-block__date">
      <text x={x} y={y} className="eskd-text approval-block__date-text" style={{ fontSize: 11 }}>
        "
      </text>
      <line x1={x + mm(2.5)} y1={baseline} x2={dayLineEnd} y2={baseline} stroke="#000" strokeWidth={LINE_THIN_PX} />
      <text x={dayLineEnd + mm(1)} y={y} className="eskd-text approval-block__date-text" style={{ fontSize: 11 }}>
        "
      </text>
      <line x1={monthLineStart} y1={baseline} x2={monthLineEnd} y2={baseline} stroke="#000" strokeWidth={LINE_THIN_PX} />
      <text x={monthLineEnd + mm(1)} y={y} className="eskd-text approval-block__date-text" style={{ fontSize: 11 }}>
        " {yearLabel}
      </text>
      <line
        x1={monthLineEnd + mm(16)}
        y1={baseline}
        x2={x + width}
        y2={baseline}
        stroke="#000"
        strokeWidth={LINE_THIN_PX}
      />
    </g>
  );
};

/** Блок согласования (правый верхний угол листа). */
export const ApprovalBlock = ({ x, y, width = mm(70), year = new Date().getFullYear() }: Props) => {
  const firstLineY = y + mm(8);

  return (
    <g className="approval-block">
      <text x={x} y={y + mm(5)} className="eskd-text approval-block__title" style={{ fontSize: 12 }}>
        Согласовано:
      </text>
      {Array.from({ length: SIGNATURE_LINE_COUNT }, (_, index) => {
        const lineY = firstLineY + index * mm(LINE_GAP_MM);
        return (
          <line key={index} x1={x} y1={lineY} x2={x + width} y2={lineY} stroke="#000" strokeWidth={LINE_THIN_PX} />
        );
      })}
      <ApprovalDateLine x={x} y={firstLineY + SIGNATURE_LINE_COUNT * mm(LINE_GAP_MM) + mm(4)} width={width} year={year} />
    </g>
  );
};
