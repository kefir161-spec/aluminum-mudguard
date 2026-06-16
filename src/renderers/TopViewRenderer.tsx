import type { MouseEvent } from 'react';
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
  onStripRemove: (stripId: string) => void;
};

const VIEW_WIDTH = 920;
const VIEW_HEIGHT = 460;
const MARGIN_X = 40;
const MARGIN_TOP = 40;
const MARGIN_BOTTOM = 36;
const DIM_TOP = 28;
const DIM_LEFT = 36;
const DRAWABLE_WIDTH = VIEW_WIDTH - MARGIN_X * 2 - DIM_LEFT;
const DRAWABLE_HEIGHT = VIEW_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM - DIM_TOP;

/** Интерактивный вид конструктора — длина по горизонтали, единый масштаб по габаритам. */
export const TopViewRenderer = ({ config, selectedStripId, onStripClick, onStripRemove }: Props) => {
  const layout = buildLayoutGeometry(
    config,
    DRAWABLE_WIDTH,
    DRAWABLE_HEIGHT,
    MARGIN_X + DIM_LEFT,
    MARGIN_TOP + DIM_TOP,
    { fit: 'contain', align: 'center' },
  );
  const lengthPxPerMm = getLengthPxPerMm(layout.matWidthPx, config.totalLengthMm);
  const layoutRects = layout.rects;
  const { resolved: layoutResolved } = layout;
  const remainderMm = layoutResolved.remainderMm;
  const filledPx = layout.layoutHeightPx;
  const gapLabel =
    layoutResolved.fitApplied && layoutResolved.gapSizesMm.length > 0
      ? `Зазоры: ${Math.min(...layoutResolved.gapSizesMm)}–${Math.max(...layoutResolved.gapSizesMm)} мм (натяжение тросов)`
      : `Зазор между планками: ${MODULE_GAP_MM} мм`;

  const handleStripContextMenu = (event: MouseEvent, stripId: string) => {
    event.preventDefault();
    onStripRemove(stripId);
  };

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="renderer-svg"
    >
      <ProfileTextureDefs widthScale={layout.scale} lengthPxPerMm={lengthPxPerMm} />
      <text x={16} y={22} textAnchor="start" className="top-view-title">
        Вид сверху
        {config.dimensionSource === 'pit' ? ` · приямок ${config.orderWidthMm}×${config.orderLengthMm} мм` : ''}
      </text>

      <rect
        x={layout.matX}
        y={layout.matY}
        width={layout.matWidthPx}
        height={layout.matHeightPx}
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
              y={rect.y}
              width={rect.width}
              height={rect.height}
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
            y={rect.y}
            width={rect.width}
            height={rect.height}
            widthScale={layout.scale}
            lengthPxPerMm={lengthPxPerMm}
            lengthAlong="x"
            stroke={selectedStripId === strip.id ? '#2563eb' : '#334155'}
            strokeWidth={selectedStripId === strip.id ? 3 : 1}
            className="strip-row"
            onClick={() => onStripClick(strip.id)}
            onContextMenu={(event) => handleStripContextMenu(event, strip.id)}
          />
        );
      })}

      {remainderMm > 0 && (
        <g className="remainder-zone">
          <rect
            x={layout.matX}
            y={layout.matY + filledPx}
            width={layout.matWidthPx}
            height={Math.max(0, layout.matHeightPx - filledPx)}
            fill="#fffbeb"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <text
            x={layout.matX + layout.matWidthPx / 2}
            y={layout.matY + filledPx + Math.max(0, layout.matHeightPx - filledPx) / 2 + 4}
            textAnchor="middle"
            className="remainder-label"
          >
            {`Остаток ${remainderMm} мм`}
          </text>
        </g>
      )}

      <HorizontalDimension
        x1={layout.matX}
        x2={layout.matX + layout.matWidthPx}
        y={layout.matY - 16}
        objectY1={layout.matY}
        objectY2={layout.matY}
        label={`${config.totalLengthMm.toFixed(0)}`}
      />

      <VerticalDimension
        x={layout.matX - 18}
        y1={layout.matY}
        y2={layout.matY + layout.matHeightPx}
        objectX1={layout.matX}
        objectX2={layout.matX}
        label={`${config.totalWidthMm.toFixed(0)}`}
        labelOffset={-8}
      />

      <text x={MARGIN_X} y={VIEW_HEIGHT - 12} className="strip-dimension">
        {gapLabel} · ПКМ по планке — удалить · размеры тросов — на вкладке «Чертёж»
      </text>
    </svg>
  );
};
