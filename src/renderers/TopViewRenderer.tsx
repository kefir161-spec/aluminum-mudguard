import type { ProductConfig } from '../domain/types';
import { MODULE_GAP_MM } from '../domain/constants';
import { getLengthPxPerMm } from '../data/profileTextures';
import { ProfileTextureDefs } from './ProfileTextureDefs';
import { ProfileStripGraphics } from './ProfileStripGraphics';
import { buildLayoutGeometry } from './layoutGeometry';
import { HorizontalDimension, VerticalDimension } from './DimensionLines';

type Props = {
  config: ProductConfig;
  selectedStripId?: string;
  onStripClick: (stripId: string) => void;
};

/** Интерактивный вид конструктора — без размеров тросов, только общие габариты. */
export const TopViewRenderer = ({ config, selectedStripId, onStripClick }: Props) => {
  const viewWidth = 920;
  const viewHeight = 340;
  const margin = 56;
  const drawableWidth = viewWidth - margin * 2;
  const drawableHeight = 220;
  const topY = 52;
  const layout = buildLayoutGeometry(config, drawableWidth, margin);
  const lengthPxPerMm = getLengthPxPerMm(drawableHeight, config.totalLengthMm);
  const layoutRects = layout.rects;
  const { resolved } = layout;
  const remainderMm = resolved.remainderMm;
  const filledPx = resolved.effectiveWidthMm * layout.scale;
  const gapLabel =
    resolved.fitApplied && resolved.gapSizesMm.length > 0
      ? `Зазоры: ${Math.min(...resolved.gapSizesMm)}–${Math.max(...resolved.gapSizesMm)} мм (натяжение тросов)`
      : `Зазор между планками: ${MODULE_GAP_MM} мм`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="renderer-svg"
    >
      <ProfileTextureDefs widthScale={layout.scale} lengthPxPerMm={lengthPxPerMm} />
      <text x={16} y={20} textAnchor="start" className="top-view-title">
        Вид сверху
        {config.dimensionSource === 'pit' ? ` · приямок ${config.orderWidthMm}×${config.orderLengthMm} мм` : ''}
      </text>

      <rect
        x={margin}
        y={topY}
        width={drawableWidth}
        height={drawableHeight}
        fill="#fff"
        stroke="#1f2937"
        strokeWidth={2}
      />
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
            className="strip-row"
            onClick={() => onStripClick(strip.id)}
          />
        );
      })}

      {remainderMm > 0 && (
        <g className="remainder-zone">
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
