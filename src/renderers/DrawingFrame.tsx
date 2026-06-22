import {
  FRAME_MARGINS_MM,
  LINE_THICK_PX,
  LINE_THIN_PX,
  mm,
  SHEET_HEIGHT_PX,
  SHEET_WIDTH_PX,
} from '../domain/eskd';

export type FrameBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

/** Внутренние границы рамки (поле чертежа) по ГОСТ 2.301. */
export const getFrameBounds = (): FrameBounds => {
  const left = mm(FRAME_MARGINS_MM.left);
  const top = mm(FRAME_MARGINS_MM.top);
  const right = SHEET_WIDTH_PX - mm(FRAME_MARGINS_MM.right);
  const bottom = SHEET_HEIGHT_PX - mm(FRAME_MARGINS_MM.bottom);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
};

/** Рамка чертежа: тонкая линия по краю листа и основная рамка с полями 20/5/5/5 мм. */
export const DrawingFrame = () => {
  const frame = getFrameBounds();

  return (
    <g className="eskd-frame">
      <rect
        x={0.5}
        y={0.5}
        width={SHEET_WIDTH_PX - 1}
        height={SHEET_HEIGHT_PX - 1}
        fill="#fff"
        stroke="#000"
        strokeWidth={LINE_THIN_PX}
      />
      <rect
        x={frame.left}
        y={frame.top}
        width={frame.width}
        height={frame.height}
        fill="none"
        stroke="#000"
        strokeWidth={LINE_THICK_PX}
      />
    </g>
  );
};
