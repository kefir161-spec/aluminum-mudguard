import type { ProductConfig } from '../domain/types';
import { MODULE_GAP_MM } from '../domain/constants';
import { getLengthPxPerMm } from '../data/profileTextures';
import { ProfileTextureDefs } from './ProfileTextureDefs';
import { ProfileStripGraphics } from './ProfileStripGraphics';
import { buildLayoutGeometry, type LayoutRect } from './layoutGeometry';
import { HorizontalDimension, VerticalDimension } from './DimensionLines';

type Props = {
  config: ProductConfig;
  selectedStripId?: string;
  onStripClick: (stripId: string) => void;
};

const MAIN_VIEW_OPACITY = 0.48;
const CORNER_WIDTH_LIMIT_MM = 96;
const CORNER_LENGTH_MM = 120;

type MatLayerProps = {
  config: ProductConfig;
  layoutRects: LayoutRect[];
  topY: number;
  drawableHeight: number;
  lengthPxPerMm: number;
  selectedStripId?: string;
  onStripClick?: (stripId: string) => void;
  opacity?: number;
  interactive?: boolean;
  idPrefix?: string;
};

const MatLayer = ({
  config,
  layoutRects,
  topY,
  drawableHeight,
  lengthPxPerMm,
  selectedStripId,
  onStripClick,
  opacity = 1,
  interactive = false,
  idPrefix = 'topview',
}: MatLayerProps) => (
  <g opacity={opacity}>
    {layoutRects.map((rect, index) => {
      if (rect.kind === 'gap') {
        return (
          <rect
            key={`gap-${index}`}
            x={rect.x}
            y={topY}
            width={rect.width}
            height={drawableHeight}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={0.5}
            strokeDasharray="3 2"
          />
        );
      }

      const strip = config.strips.find((item) => item.id === rect.stripId);
      if (!strip) return null;

      return (
        <ProfileStripGraphics
          key={strip.id}
          type={strip.type}
          x={rect.x}
          y={topY}
          width={rect.width}
          height={drawableHeight}
          lengthPxPerMm={lengthPxPerMm}
          stroke={selectedStripId === strip.id ? '#2563eb' : '#334155'}
          strokeWidth={selectedStripId === strip.id ? 3 : 1}
          className={interactive ? 'strip-row' : undefined}
          onClick={interactive ? () => onStripClick?.(strip.id) : undefined}
          idPrefix={idPrefix}
        />
      );
    })}
  </g>
);

const collectCornerWidth = (layoutRects: LayoutRect[], scale: number): number => {
  let widthMm = 0;
  let widthPx = 0;

  for (const rect of layoutRects) {
    const segmentMm = rect.kind === 'gap' ? (rect.gapMm ?? MODULE_GAP_MM) : rect.width / scale;
    if (widthMm >= CORNER_WIDTH_LIMIT_MM && widthPx > 0) break;
    widthPx += rect.width;
    widthMm += segmentMm;
  }

  return widthPx > 0 ? widthPx : layoutRects[0]?.width ?? 40;
};

/** Интерактивный вид конструктора — без размеров тросов, только общие габариты. */
export const TopViewRenderer = ({ config, selectedStripId, onStripClick }: Props) => {
  const viewWidth = 920;
  const viewHeight = 390;
  const margin = 56;
  const drawableWidth = viewWidth - margin * 2;
  const drawableHeight = 220;
  const topY = 108;
  const layout = buildLayoutGeometry(config, drawableWidth, margin);
  const lengthPxPerMm = getLengthPxPerMm(drawableHeight, config.totalLengthMm);
  const layoutRects = layout.rects;
  const { resolved } = layout;
  const remainderMm = resolved.remainderMm;
  const filledPx = resolved.effectiveWidthMm * layout.scale;
  const cornerWidthPx = collectCornerWidth(layoutRects, layout.scale);
  const cornerHeightPx = Math.min(
    drawableHeight,
    (Math.min(CORNER_LENGTH_MM, config.totalLengthMm) / config.totalLengthMm) * drawableHeight,
  );
  const calloutW = 172;
  const calloutH = 122;
  const calloutX = 16;
  const calloutY = 34;
  const gapLabel =
    resolved.fitApplied && resolved.gapSizesMm.length > 0
      ? `Зазоры: ${Math.min(...resolved.gapSizesMm)}–${Math.max(...resolved.gapSizesMm)} мм (натяжение тросов)`
      : `Зазор между планками: ${MODULE_GAP_MM} мм`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="renderer-svg top-view-svg"
    >
      <ProfileTextureDefs widthScale={layout.scale} lengthPxPerMm={lengthPxPerMm} idPrefix="topview" />

      <text x={16} y={20} textAnchor="start" className="top-view-title">
        Вид сверху
        {config.dimensionSource === 'pit' ? ` · приямок ${config.orderWidthMm}×${config.orderLengthMm} мм` : ''}
      </text>

      <g className="top-view-callout">
        <rect
          x={calloutX}
          y={calloutY}
          width={calloutW}
          height={calloutH}
          className="top-view-callout__frame"
          rx={6}
        />
        <text x={calloutX + 10} y={calloutY + 14} className="top-view-callout__label">
          Левый верхний угол
        </text>
        <svg
          x={calloutX + 8}
          y={calloutY + 20}
          width={calloutW - 16}
          height={calloutH - 28}
          viewBox={`${margin} ${topY} ${cornerWidthPx} ${cornerHeightPx}`}
          preserveAspectRatio="xMidYMid meet"
          className="top-view-callout__zoom"
        >
          <rect x={margin} y={topY} width={cornerWidthPx} height={cornerHeightPx} fill="#fff" />
          <MatLayer
            config={config}
            layoutRects={layoutRects}
            topY={topY}
            drawableHeight={drawableHeight}
            lengthPxPerMm={lengthPxPerMm}
            selectedStripId={selectedStripId}
          />
        </svg>
        <polyline
          points={`${calloutX + calloutW},${calloutY + calloutH * 0.55} ${margin - 10},${topY + 10} ${margin},${topY}`}
          className="top-view-callout__leader"
        />
      </g>

      <rect
        x={margin}
        y={topY}
        width={drawableWidth}
        height={drawableHeight}
        fill="#fff"
        stroke="#1f2937"
        strokeWidth={2}
      />

      <MatLayer
        config={config}
        layoutRects={layoutRects}
        topY={topY}
        drawableHeight={drawableHeight}
        lengthPxPerMm={lengthPxPerMm}
        selectedStripId={selectedStripId}
        onStripClick={onStripClick}
        opacity={MAIN_VIEW_OPACITY}
        interactive
      />

      <rect
        x={margin}
        y={topY}
        width={cornerWidthPx}
        height={cornerHeightPx}
        className="top-view-corner-mark"
      />

      {remainderMm > 0 && (
        <g className="remainder-zone" opacity={MAIN_VIEW_OPACITY}>
          <rect
            x={margin + filledPx}
            y={topY}
            width={Math.max(0, drawableWidth - filledPx)}
            height={drawableHeight}
            fill="#fffbeb"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <text
            x={margin + filledPx + Math.max(0, drawableWidth - filledPx) / 2}
            y={topY + drawableHeight / 2 + 4}
            textAnchor="middle"
            className="remainder-label"
          >
            {`Остаток ${remainderMm} мм`}
          </text>
        </g>
      )}

      <HorizontalDimension
        x1={margin}
        x2={margin + drawableWidth}
        y={topY - 22}
        objectY1={topY}
        objectY2={topY}
        label={`${config.totalWidthMm.toFixed(0)}`}
      />

      <VerticalDimension
        x={margin - 22}
        y1={topY}
        y2={topY + drawableHeight}
        objectX1={margin}
        objectX2={margin}
        label={`${config.totalLengthMm.toFixed(0)}`}
        labelOffset={-8}
      />

      <text x={margin} y={viewHeight - 10} className="strip-dimension">
        {gapLabel} · размеры тросов — на вкладке «Чертёж»
      </text>
    </svg>
  );
};
