import { useMemo } from 'react';
import type { MouseEvent } from 'react';
import type { ProductConfig } from '../domain/types';
import { formatPitSubtitle } from '../domain/dimensionLabels';
import { getLengthPxPerMm } from '../data/profileTextures';
import { ProfileTextureDefs } from './ProfileTextureDefs';
import { ProfileStripGraphics } from './ProfileStripGraphics';
import { buildLayoutGeometry } from './layoutGeometry';
import { HorizontalDimension, VerticalDimension } from './DimensionLines';
import { getTopViewChrome, getTopViewDrawable, TOP_VIEW_MAT_SIZE_FACTOR } from './topViewLayout';

type Props = {
  config: ProductConfig;
  selectedStripId?: string;
  onStripClick: (stripId: string) => void;
  onStripRemove: (stripId: string) => void;
  isFullscreen?: boolean;
  viewport?: { width: number; height: number };
};

const getStripStroke = (stripId: string, selectedStripId: string | undefined): { stroke: string; strokeWidth: number } => {
  if (selectedStripId === stripId) return { stroke: '#2563eb', strokeWidth: 3 };
  return { stroke: '#334155', strokeWidth: 1 };
};

/** Интерактивный вид конструктора — длина по горизонтали, единый масштаб по габаритам. */
export const TopViewRenderer = ({
  config,
  selectedStripId,
  onStripClick,
  onStripRemove,
  isFullscreen = false,
  viewport,
}: Props) => {
  const chrome = getTopViewChrome(isFullscreen, viewport);
  const drawable = getTopViewDrawable(chrome);
  const layout = buildLayoutGeometry(
    config,
    drawable.width,
    drawable.height,
    drawable.originX,
    drawable.originY,
    { fit: 'contain', align: 'center', sizeFactor: TOP_VIEW_MAT_SIZE_FACTOR },
  );
  const lengthPxPerMm = getLengthPxPerMm(layout.matWidthPx, config.totalLengthMm);
  const layoutRects = layout.rects;
  const { resolved: layoutResolved } = layout;
  const remainderMm = layoutResolved.remainderMm;
  const filledPx = layout.layoutHeightPx;

  const stripById = useMemo(
    () => new Map(config.strips.map((strip) => [strip.id, strip])),
    [config.strips],
  );

  const handleStripContextMenu = (event: MouseEvent, stripId: string) => {
    event.preventDefault();
    onStripRemove(stripId);
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${chrome.viewWidth} ${chrome.viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="renderer-svg renderer-svg--fill"
    >
      <ProfileTextureDefs widthScale={layout.scale} lengthPxPerMm={lengthPxPerMm} />
      {chrome.showTitle && (
        <text x={chrome.titleX} y={chrome.titleY} textAnchor="start" className="top-view-title">
          Вид сверху
          {config.dimensionSource === 'pit'
            ? ` · ${formatPitSubtitle(config.orderLengthMm, config.orderWidthMm)}`
            : ''}
        </text>
      )}

      <rect
        x={layout.matX}
        y={layout.matY}
        width={layout.matWidthPx}
        height={layout.matHeightPx}
        fill="#fff"
        stroke="#1f2937"
        strokeWidth={2}
      />
      {/* Слой 1 (под текстурой): подсветка выбранной планки. */}
      {layoutRects.map((rect) => {
        if (rect.kind !== 'strip' || !rect.stripId) return null;
        const strip = stripById.get(rect.stripId);
        if (!strip || selectedStripId !== strip.id) return null;
        return (
          <rect
            key={`hl-${strip.id}`}
            x={rect.x - 1}
            y={rect.y - 1}
            width={rect.width + 2}
            height={rect.height + 2}
            fill="rgba(37, 99, 235, 0.14)"
            stroke="none"
            pointerEvents="none"
          />
        );
      })}

      {/* Слой 2 (статичный): текстуры профилей и зазоры. Мемоизируется, не зависит от выбора. */}
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

        if (!rect.stripId) return null;
        const strip = stripById.get(rect.stripId);
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
            stroke="#334155"
            strokeWidth={1}
            className="strip-row"
          />
        );
      })}

      {/* Слой 3 (над текстурой): интерактив и обводка выбранной планки. */}
      {layoutRects.map((rect) => {
        if (rect.kind !== 'strip' || !rect.stripId) return null;
        const strip = stripById.get(rect.stripId);
        if (!strip) return null;
        const isSelected = selectedStripId === strip.id;
        const stripStyle = getStripStroke(strip.id, selectedStripId);
        return (
          <g key={`ix-${strip.id}`}>
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => onStripClick(strip.id)}
              onContextMenu={(event) => handleStripContextMenu(event, strip.id)}
            />
            {isSelected && (
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill="none"
                stroke={stripStyle.stroke}
                strokeWidth={stripStyle.strokeWidth}
                pointerEvents="none"
              />
            )}
          </g>
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
        label={`Ширина ${config.totalLengthMm.toFixed(0)}`}
      />

      <VerticalDimension
        x={layout.matX - 18}
        y1={layout.matY}
        y2={layout.matY + layout.matHeightPx}
        objectX1={layout.matX}
        objectX2={layout.matX}
        label={`Длина ${config.totalWidthMm.toFixed(0)}`}
        labelOffset={-8}
      />

    </svg>
  );
};
