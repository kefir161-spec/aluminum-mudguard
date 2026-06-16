type HorizontalDimensionProps = {
  x1: number;
  x2: number;
  y: number;
  objectY1: number;
  objectY2: number;
  label: string;
  className?: string;
};

type VerticalDimensionProps = {
  x: number;
  y1: number;
  y2: number;
  objectX1: number;
  objectX2: number;
  label: string;
  className?: string;
  labelOffset?: number;
};

const dimLine = (x1: number, y1: number, x2: number, y2: number, key: string) => (
  <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={0.75} />
);

const arrowOut = (x: number, y: number, dir: 'up' | 'down' | 'left' | 'right', key: string) => {
  const s = 3.5;
  if (dir === 'up') return <polygon key={key} points={`${x},${y} ${x - s},${y + s} ${x + s},${y + s}`} fill="#334155" />;
  if (dir === 'down') return <polygon key={key} points={`${x},${y} ${x - s},${y - s} ${x + s},${y - s}`} fill="#334155" />;
  if (dir === 'left') return <polygon key={key} points={`${x},${y} ${x + s},${y - s} ${x + s},${y + s}`} fill="#334155" />;
  return <polygon key={key} points={`${x},${y} ${x - s},${y - s} ${x - s},${y + s}`} fill="#334155" />;
};

/** Горизонтальный размер с выносными линиями. */
export const HorizontalDimension = ({
  x1,
  x2,
  y,
  objectY1,
  objectY2,
  label,
  className = 'dim-annotation',
}: HorizontalDimensionProps) => (
  <g className={className}>
    {dimLine(x1, objectY1, x1, y, 'ext-l')}
    {dimLine(x2, objectY2, x2, y, 'ext-r')}
    {dimLine(x1, y, x2, y, 'dim')}
    {arrowOut(x1, y, 'left', 'arr-l')}
    {arrowOut(x2, y, 'right', 'arr-r')}
    <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle" className="dim-label">
      {label}
    </text>
  </g>
);

type VerticalDimensionExtendedProps = VerticalDimensionProps & {
  anchorY1?: number;
  anchorY2?: number;
  horizontalLabel?: boolean;
};

/** Вертикальный размер с выносными линиями. */
export const VerticalDimension = ({
  x,
  y1,
  y2,
  objectX1,
  objectX2,
  label,
  className = 'dim-annotation',
  labelOffset = 0,
  anchorY1,
  anchorY2,
  horizontalLabel = false,
}: VerticalDimensionExtendedProps) => {
  const extY1 = anchorY1 ?? y1;
  const extY2 = anchorY2 ?? y2;
  const midY = (y1 + y2) / 2;

  return (
    <g className={className}>
      {dimLine(objectX1, extY1, x, extY1, 'ext-t')}
      {dimLine(objectX2, extY2, x, extY2, 'ext-b')}
      {dimLine(x, y1, x, y2, 'dim')}
      {arrowOut(x, y1, 'up', 'arr-t')}
      {arrowOut(x, y2, 'down', 'arr-b')}
      {horizontalLabel ? (
        <text x={x + labelOffset - 10} y={midY + 3} textAnchor="end" className="dim-label">
          {label}
        </text>
      ) : (
        <text
          x={x + labelOffset}
          y={midY}
          textAnchor="middle"
          className="dim-label"
          transform={`rotate(-90 ${x + labelOffset} ${midY})`}
        >
          {label}
        </text>
      )}
    </g>
  );
};

const MIN_SEGMENT_PX = 20;

type CableAnnotationProps = {
  matX: number;
  matY: number;
  matW: number;
  totalLengthMm: number;
  edgeOffsetMm: number;
  spacingsMm: number[];
  className?: string;
};

const mmToY = (mm: number, totalLengthMm: number, viewTop: number, viewHeight: number): number =>
  viewTop + (mm / totalLengthMm) * viewHeight;

const mmToX = (mm: number, totalLengthMm: number, viewLeft: number, viewWidth: number): number =>
  viewLeft + (mm / totalLengthMm) * viewWidth;

type ChainSegment = {
  startMm: number;
  endMm: number;
  label: string;
};

const buildCableChainSegments = (
  totalLengthMm: number,
  edgeOffsetMm: number,
  spacingsMm: number[],
): ChainSegment[] => {
  const segments: ChainSegment[] = [
    { startMm: 0, endMm: edgeOffsetMm, label: `${edgeOffsetMm}` },
  ];

  let cursor = edgeOffsetMm;
  for (const spacing of spacingsMm) {
    segments.push({
      startMm: cursor,
      endMm: cursor + spacing,
      label: `${spacing}`,
    });
    cursor += spacing;
  }

  segments.push({
    startMm: totalLengthMm - edgeOffsetMm,
    endMm: totalLengthMm,
    label: `${edgeOffsetMm}`,
  });

  return segments;
};

type VerticalChainProps = {
  x: number;
  objectX: number;
  totalLengthMm: number;
  viewTop: number;
  viewHeight: number;
  segments: ChainSegment[];
  className?: string;
};

/** Цепочка вертикальных размеров на всю высоту — одна колонка, сегменты не перекрываются по Y. */
export const VerticalDimensionChain = ({
  x,
  objectX,
  totalLengthMm,
  viewTop,
  viewHeight,
  segments,
  className = 'dim-annotation',
}: VerticalChainProps) => (
  <g className={className}>
    {segments.map((segment, index) => {
      const anchorY1 = mmToY(segment.startMm, totalLengthMm, viewTop, viewHeight);
      const anchorY2 = mmToY(segment.endMm, totalLengthMm, viewTop, viewHeight);
      if (Math.abs(anchorY2 - anchorY1) < 2) return null;

      const dimX = x;
      const spanPx = Math.abs(anchorY2 - anchorY1);
      const compact = spanPx < MIN_SEGMENT_PX;
      const center = (anchorY1 + anchorY2) / 2;
      const dimY1 = compact ? center - MIN_SEGMENT_PX / 2 : anchorY1;
      const dimY2 = compact ? center + MIN_SEGMENT_PX / 2 : anchorY2;

      return (
        <VerticalDimension
          key={`${segment.label}-${segment.startMm}-${index}`}
          x={dimX}
          y1={dimY1}
          y2={dimY2}
          anchorY1={anchorY1}
          anchorY2={anchorY2}
          objectX1={objectX}
          objectX2={objectX}
          label={segment.label}
          labelOffset={-6}
          horizontalLabel={compact}
        />
      );
    })}
  </g>
);

/** Цепочка горизонтальных размеров вдоль длины ковра. */
export const HorizontalDimensionChain = ({
  y,
  objectY,
  totalLengthMm,
  viewLeft,
  viewWidth,
  segments,
  className = 'dim-annotation',
}: {
  y: number;
  objectY: number;
  totalLengthMm: number;
  viewLeft: number;
  viewWidth: number;
  segments: ChainSegment[];
  className?: string;
}) => (
  <g className={className}>
    {segments.map((segment, index) => {
      const anchorX1 = mmToX(segment.startMm, totalLengthMm, viewLeft, viewWidth);
      const anchorX2 = mmToX(segment.endMm, totalLengthMm, viewLeft, viewWidth);
      if (Math.abs(anchorX2 - anchorX1) < 2) return null;

      const dimY = y;
      const spanPx = Math.abs(anchorX2 - anchorX1);
      const compact = spanPx < MIN_SEGMENT_PX;
      const center = (anchorX1 + anchorX2) / 2;
      const dimX1 = compact ? center - MIN_SEGMENT_PX / 2 : anchorX1;
      const dimX2 = compact ? center + MIN_SEGMENT_PX / 2 : anchorX2;

      return (
        <HorizontalDimension
          key={`${segment.label}-${segment.startMm}-${index}`}
          x1={dimX1}
          x2={dimX2}
          y={dimY}
          objectY1={objectY}
          objectY2={objectY}
          label={segment.label}
        />
      );
    })}
  </g>
);

/** Размеры тросов сверху: цепочка вдоль длины ковра. */
export const CableSpacingAnnotation = ({
  matX,
  matY,
  matW,
  totalLengthMm,
  edgeOffsetMm,
  spacingsMm,
  className = 'dim-annotation',
}: CableAnnotationProps) => {
  const segments = buildCableChainSegments(totalLengthMm, edgeOffsetMm, spacingsMm);

  return (
    <HorizontalDimensionChain
      y={matY - 34}
      objectY={matY}
      totalLengthMm={totalLengthMm}
      viewLeft={matX}
      viewWidth={matW}
      segments={segments}
      className={className}
    />
  );
};
