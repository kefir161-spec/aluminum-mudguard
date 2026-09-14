import type { ReactElement } from 'react';

type Side = 'top' | 'right' | 'bottom' | 'left';

type Props = {
  x: number;
  y: number;
  width: number;
  height: number;
  kantPx: number;
  idPrefix?: string;
};

const ALUMINUM = {
  light: '#f4f5f6',
  mid: '#d5d8dc',
  ridge: '#b7bcc2',
  groove: '#9aa0a7',
  bevel: '#c4c7cb',
  bevelDark: '#a8adb3',
  edge: '#7d838a',
  inner: '#e8eaed',
};

const ridgeCount = (kantPx: number): number => {
  if (kantPx < 6) return 3;
  if (kantPx < 14) return 5;
  return 7;
};

const sidePolygon = (
  side: Side,
  x: number,
  y: number,
  width: number,
  height: number,
  kantPx: number,
): string => {
  const r = x + width;
  const b = y + height;
  if (side === 'top') {
    return `${x},${y} ${r},${y} ${r - kantPx},${y + kantPx} ${x + kantPx},${y + kantPx}`;
  }
  if (side === 'right') {
    return `${r},${y} ${r},${b} ${r - kantPx},${b - kantPx} ${r - kantPx},${y + kantPx}`;
  }
  if (side === 'bottom') {
    return `${x},${b} ${r},${b} ${r - kantPx},${b - kantPx} ${x + kantPx},${b - kantPx}`;
  }
  return `${x},${y} ${x},${b} ${x + kantPx},${b - kantPx} ${x + kantPx},${y + kantPx}`;
};

const chamferPolygon = (
  side: Side,
  x: number,
  y: number,
  width: number,
  height: number,
  chamferPx: number,
): string => {
  const r = x + width;
  const b = y + height;
  if (side === 'top') {
    return `${x},${y} ${r},${y} ${r - chamferPx},${y + chamferPx} ${x + chamferPx},${y + chamferPx}`;
  }
  if (side === 'right') {
    return `${r},${y} ${r},${b} ${r - chamferPx},${b - chamferPx} ${r - chamferPx},${y + chamferPx}`;
  }
  if (side === 'bottom') {
    return `${x},${b} ${r},${b} ${r - chamferPx},${b - chamferPx} ${x + chamferPx},${b - chamferPx}`;
  }
  return `${x},${y} ${x},${b} ${x + chamferPx},${b - chamferPx} ${x + chamferPx},${y + chamferPx}`;
};

const RidgeLines = ({
  side,
  x,
  y,
  width,
  height,
  kantPx,
}: {
  side: Side;
  x: number;
  y: number;
  width: number;
  height: number;
  kantPx: number;
}) => {
  const count = ridgeCount(kantPx);
  const step = kantPx / (count + 1);
  const lines: ReactElement[] = [];

  for (let i = 1; i <= count; i += 1) {
    const offset = step * i;
    if (side === 'top') {
      const yLine = y + offset;
      const inset = offset;
      lines.push(
        <line
          key={`${side}-${i}`}
          x1={x + inset}
          y1={yLine}
          x2={x + width - inset}
          y2={yLine}
          stroke={i === 1 ? ALUMINUM.groove : ALUMINUM.ridge}
          strokeWidth={i % 2 === 0 ? 0.9 : 0.55}
        />,
      );
    } else if (side === 'bottom') {
      const yLine = y + height - offset;
      const inset = offset;
      lines.push(
        <line
          key={`${side}-${i}`}
          x1={x + inset}
          y1={yLine}
          x2={x + width - inset}
          y2={yLine}
          stroke={i === 1 ? ALUMINUM.groove : ALUMINUM.ridge}
          strokeWidth={i % 2 === 0 ? 0.9 : 0.55}
        />,
      );
    } else if (side === 'left') {
      const xLine = x + offset;
      const inset = offset;
      lines.push(
        <line
          key={`${side}-${i}`}
          x1={xLine}
          y1={y + inset}
          x2={xLine}
          y2={y + height - inset}
          stroke={i === 1 ? ALUMINUM.groove : ALUMINUM.ridge}
          strokeWidth={i % 2 === 0 ? 0.9 : 0.55}
        />,
      );
    } else {
      const xLine = x + width - offset;
      const inset = offset;
      lines.push(
        <line
          key={`${side}-${i}`}
          x1={xLine}
          y1={y + inset}
          x2={xLine}
          y2={y + height - inset}
          stroke={i === 1 ? ALUMINUM.groove : ALUMINUM.ridge}
          strokeWidth={i % 2 === 0 ? 0.9 : 0.55}
        />,
      );
    }
  }

  return <>{lines}</>;
};

/** Алюминиевый кант: рифлёный профиль, фаска по наружному краю, ус 45°. */
export const KantFrameGraphics = ({ x, y, width, height, kantPx, idPrefix = 'kant' }: Props) => {
  if (kantPx < 1 || width <= kantPx * 2 || height <= kantPx * 2) return null;

  const chamferPx = Math.max(kantPx * 0.28, 1.2);
  const clipId = `${idPrefix}-kant-clip`;
  const sides: Side[] = ['top', 'right', 'bottom', 'left'];

  return (
    <g className="kant-frame" pointerEvents="none">
      <defs>
        <clipPath id={clipId}>
          {sides.map((side) => (
            <polygon key={side} points={sidePolygon(side, x, y, width, height, kantPx)} />
          ))}
        </clipPath>
        <linearGradient id={`${idPrefix}-kant-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ALUMINUM.light} />
          <stop offset="45%" stopColor={ALUMINUM.mid} />
          <stop offset="100%" stopColor={ALUMINUM.bevel} />
        </linearGradient>
      </defs>

      {sides.map((side) => (
        <polygon
          key={`body-${side}`}
          points={sidePolygon(side, x, y, width, height, kantPx)}
          fill={`url(#${idPrefix}-kant-fill)`}
          stroke={ALUMINUM.edge}
          strokeWidth={0.7}
        />
      ))}

      <g clipPath={`url(#${clipId})`}>
        {sides.map((side) => (
          <RidgeLines
            key={`ridges-${side}`}
            side={side}
            x={x}
            y={y}
            width={width}
            height={height}
            kantPx={kantPx}
          />
        ))}
      </g>

      {sides.map((side) => (
        <polygon
          key={`chamfer-${side}`}
          points={chamferPolygon(side, x, y, width, height, chamferPx)}
          fill={ALUMINUM.bevel}
          opacity={0.55}
          stroke="none"
        />
      ))}

      <polygon
        points={`${x},${y} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}`}
        fill="none"
        stroke={ALUMINUM.edge}
        strokeWidth={1.1}
      />
      <rect
        x={x + kantPx}
        y={y + kantPx}
        width={width - 2 * kantPx}
        height={height - 2 * kantPx}
        fill="none"
        stroke={ALUMINUM.inner}
        strokeWidth={1}
      />

      <line x1={x} y1={y} x2={x + kantPx} y2={y + kantPx} stroke={ALUMINUM.groove} strokeWidth={0.8} />
      <line
        x1={x + width}
        y1={y}
        x2={x + width - kantPx}
        y2={y + kantPx}
        stroke={ALUMINUM.groove}
        strokeWidth={0.8}
      />
      <line
        x1={x + width}
        y1={y + height}
        x2={x + width - kantPx}
        y2={y + height - kantPx}
        stroke={ALUMINUM.groove}
        strokeWidth={0.8}
      />
      <line
        x1={x}
        y1={y + height}
        x2={x + kantPx}
        y2={y + height - kantPx}
        stroke={ALUMINUM.groove}
        strokeWidth={0.8}
      />
    </g>
  );
};
