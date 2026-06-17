import { getScraperEdgeWarnings, deriveLegendTypesFromStrips } from '../domain/layoutRules';
import { DRAWING_EXPORT_HEIGHT, DRAWING_EXPORT_ID, DRAWING_EXPORT_WIDTH } from '../export/drawingExport';
import { moduleDefinitions } from '../domain/moduleDefinitions';
import type { CalculationResult, ProductConfig } from '../domain/types';
import { getLengthPxPerMm } from '../data/profileTextures';
import { ProfileTextureDefs } from './ProfileTextureDefs';
import { ProfileStripGraphics } from './ProfileStripGraphics';
import { buildLayoutGeometry, cablePositionsAlongLength } from './layoutGeometry';
import { CableSpacingAnnotation, HorizontalDimension, VerticalDimension } from './DimensionLines';
import {
  computeSheetLayout,
  LEGEND_ROW_H,
  LEGEND_SWATCH_H,
  LEGEND_SWATCH_W,
} from './drawingLayout';
import { ApprovalBlock } from './ApprovalBlock';
import { DrawingSizeInfo } from './DrawingSizeInfo';
import { getCalculatedLayoutWidthMm, getRequestedLayoutWidthMm } from './drawingSizeMetrics';
import { DrawingSpecTable } from './DrawingSpecTable';
import { LegendSwatch } from './LegendSwatch';

type Props = {
  config: ProductConfig;
  calculation: CalculationResult;
  forExport?: boolean;
};

const WIDTH_DIM_GAP = 24;

export const DrawingSheet = ({ config, calculation, forExport = false }: Props) => {
  const width = DRAWING_EXPORT_WIDTH;
  const height = DRAWING_EXPORT_HEIGHT;
  const cableLayout = calculation.cableLayout;
  const cableCount = cableLayout?.count ?? 0;
  const hasCableAnnotation = Boolean(cableLayout && cableLayout.spacingsMm.length > 0);

  const legendTypes = deriveLegendTypesFromStrips(
    config.strips,
    config.layoutPattern,
    config.autoFillEnabled ?? false,
  );
  const layout = computeSheetLayout({
    sheetW: width,
    sheetH: height,
    hasCableAnnotation,
    legendCount: legendTypes.length,
  });

  const matLayout = buildLayoutGeometry(config, layout.matW, layout.matH, layout.matX, layout.matY, {
    fit: 'contain',
    align: 'center',
  });
  const layoutRects = matLayout.rects;
  const cableLinesX =
    cableLayout && config.totalLengthMm > 0
      ? cablePositionsAlongLength(
          config.totalLengthMm,
          matLayout.matX,
          matLayout.matWidthPx,
          cableLayout.positionsMm,
        )
      : [];
  const requestedWidthMm = getRequestedLayoutWidthMm(calculation);
  const calculatedWidthMm = getCalculatedLayoutWidthMm(calculation);
  const lengthPxPerMm = getLengthPxPerMm(matLayout.matWidthPx, config.totalLengthMm);
  const widthToY = (widthMm: number): number => matLayout.matY + widthMm * matLayout.scale;
  const requestedDimX = layout.widthDimX + WIDTH_DIM_GAP;
  const calculatedDimX = layout.widthDimX;
  const layoutComplete = !calculation.isUnderfilled;
  const drawingWarnings = getScraperEdgeWarnings(config.strips, layoutComplete);

  return (
    <div
      className={forExport ? 'drawing-sheet drawing-sheet--export' : 'drawing-sheet'}
      id={forExport ? DRAWING_EXPORT_ID : undefined}
    >
      {!forExport && drawingWarnings.length > 0 && (
        <div className="drawing-sheet-warnings">
          {drawingWarnings.map((warning) => (
            <p key={warning} className="warning">
              {warning}
            </p>
          ))}
        </div>
      )}
      <svg
        width={forExport ? width : '100%'}
        height={forExport ? height : undefined}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="drawing-sheet-svg"
      >
        <ProfileTextureDefs widthScale={matLayout.scale} lengthPxPerMm={lengthPxPerMm} idPrefix="drawing" />

        <rect x={16} y={16} width={width - 32} height={height - 32} fill="#fff" stroke="#111827" strokeWidth={1.5} />

        <text x={40} y={48} className="sheet-title">
          Технический лист грязезащитного покрытия
        </text>
        <text x={40} y={70} className="sheet-meta">{`Проект: ${config.projectName}`}</text>
        <text x={40} y={90} className="sheet-meta">{`Клиент: ${config.clientName || '—'} · Менеджер: ${config.managerName || '—'}`}</text>

        <ApprovalBlock
          x={layout.approvalX}
          y={layout.approvalY}
          width={layout.approvalW}
          year={new Date(config.updatedAt).getFullYear()}
        />

        {hasCableAnnotation && cableLayout && (
          <CableSpacingAnnotation
            matX={matLayout.matX}
            matY={matLayout.matY}
            matW={matLayout.matWidthPx}
            totalLengthMm={config.totalLengthMm}
            edgeOffsetMm={cableLayout.edgeOffsetMm}
            spacingsMm={cableLayout.spacingsMm}
          />
        )}

        <rect
          x={matLayout.matX}
          y={matLayout.matY}
          width={matLayout.matWidthPx}
          height={matLayout.matHeightPx}
          fill="#fff"
          stroke="#1f2937"
          strokeWidth={1.2}
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
                fill="#f1f5f9"
                stroke="#94a3b8"
                strokeWidth={0.35}
                strokeDasharray="2 2"
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
              widthScale={matLayout.scale}
              lengthPxPerMm={lengthPxPerMm}
              lengthAlong="x"
              stroke="#334155"
              strokeWidth={0.5}
              idPrefix="drawing"
            />
          );
        })}

        {cableLinesX.map((lineX, index) => (
          <line
            key={`cable-guide-${index}`}
            x1={lineX}
            y1={matLayout.matY}
            x2={lineX}
            y2={matLayout.matY + matLayout.matHeightPx}
            stroke="#94a3b8"
            strokeWidth={0.5}
            strokeDasharray="5 4"
          />
        ))}

        <HorizontalDimension
          x1={matLayout.matX}
          x2={matLayout.matX + matLayout.matWidthPx}
          y={layout.lengthDimY}
          objectY1={matLayout.matY + matLayout.matHeightPx}
          objectY2={matLayout.matY + matLayout.matHeightPx}
          label={`Ширина ${config.totalLengthMm.toFixed(0)}`}
        />

        <VerticalDimension
          x={requestedDimX}
          y1={matLayout.matY}
          y2={widthToY(requestedWidthMm)}
          objectX1={matLayout.matX + matLayout.matWidthPx}
          objectX2={matLayout.matX + matLayout.matWidthPx}
          label={`Длина запр. ${Math.round(requestedWidthMm)}`}
          labelOffset={12}
        />
        <VerticalDimension
          x={calculatedDimX}
          y1={matLayout.matY}
          y2={widthToY(calculatedWidthMm)}
          objectX1={matLayout.matX + matLayout.matWidthPx}
          objectX2={matLayout.matX + matLayout.matWidthPx}
          label={`Длина расч. ${Math.round(calculatedWidthMm)}`}
          labelOffset={12}
        />

        <rect
          x={layout.legendX}
          y={layout.legendY}
          width={layout.legendW}
          height={layout.legendH}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth={1}
          rx={6}
        />
        <text x={layout.legendX + 14} y={layout.legendY + 22} className="sheet-subtitle">
          Легенда
        </text>
        {legendTypes.map((type, i) => {
          const rowY = layout.legendY + 34 + i * LEGEND_ROW_H;
          return (
            <g key={`legend-${type}-${i}`}>
              <LegendSwatch
                type={type}
                x={layout.legendX + 14}
                y={rowY}
                width={LEGEND_SWATCH_W}
                height={LEGEND_SWATCH_H}
              />
              <text x={layout.legendX + 14 + LEGEND_SWATCH_W + 10} y={rowY + 15} className="sheet-meta sheet-meta--legend">
                {moduleDefinitions[type].shortName}
              </text>
            </g>
          );
        })}

        <DrawingSizeInfo
          x={layout.sizeInfoX}
          y={layout.sizeInfoY}
          config={config}
          calculation={calculation}
        />

        <text x={40} y={layout.specY} className="sheet-subtitle">
          Спецификация
        </text>
        <DrawingSpecTable x={40} y={layout.specY + 16} calculation={calculation} cableCount={cableCount} />
      </svg>
    </div>
  );
};
