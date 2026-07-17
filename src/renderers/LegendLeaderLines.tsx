import { moduleDefinitions } from '../domain/moduleDefinitions';
import type { ModuleType, Strip } from '../domain/types';
import { LINE_THIN_PX, mm } from '../domain/eskd';
import type { LayoutRect } from './layoutGeometry';

export type LegendAnchor = {
  type: ModuleType;
  y: number;
  label: string;
};

/** Первое вхождение каждого типа планки сверху вниз — для выносок. */
export const buildLegendAnchors = (layoutRects: LayoutRect[], strips: Strip[]): LegendAnchor[] => {
  const seen = new Set<ModuleType>();
  const anchors: LegendAnchor[] = [];

  for (const rect of layoutRects) {
    if (rect.kind !== 'strip' || !rect.stripId) continue;
    const strip = strips.find((item) => item.id === rect.stripId);
    if (!strip || seen.has(strip.type)) continue;
    seen.add(strip.type);
    anchors.push({
      type: strip.type,
      y: rect.y + rect.height / 2,
      label: `Планка "${moduleDefinitions[strip.type].shortName}"`,
    });
  }

  return anchors;
};

type Props = {
  matRight: number;
  anchors: LegendAnchor[];
  labelX: number;
};

/** Условные обозначения выносками справа от полотна. */
export const LegendLeaderLines = ({ matRight, anchors, labelX }: Props) => (
  <g className="eskd-legend-leaders">
    {anchors.map((anchor) => (
      <g key={anchor.type}>
        <line
          x1={matRight}
          y1={anchor.y}
          x2={labelX - mm(1)}
          y2={anchor.y}
          stroke="#000"
          strokeWidth={LINE_THIN_PX}
        />
        <circle cx={matRight} cy={anchor.y} r={mm(0.6)} fill="#000" />
        <text
          x={labelX}
          y={anchor.y + mm(1.2)}
          className="eskd-text"
          style={{ fontSize: 11 }}
        >
          {anchor.label}
        </text>
      </g>
    ))}
  </g>
);
