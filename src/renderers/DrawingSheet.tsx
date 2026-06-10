import { getScraperEdgeWarnings, deriveLegendTypesFromStrips } from '../domain/layoutRules';
import { DRAWING_EXPORT_HEIGHT, DRAWING_EXPORT_ID, DRAWING_EXPORT_WIDTH } from '../export/drawingExport';
import { moduleDefinitions } from '../domain/moduleDefinitions';
import type { CalculationResult, ProductConfig } from '../domain/types';
import { getLengthPxPerMm } from '../data/profileTextures';
import { ProfileTextureDefs } from './ProfileTextureDefs';
import { ProfileStripGraphics } from './ProfileStripGraphics';
import { buildLayoutGeometry, cableYPositions } from './layoutGeometry';
import { CableSpacingAnnotation, HorizontalDimension, VerticalDimension } from './DimensionLines';
import { computeSheetLayout } from './drawingLayout';
import { ApprovalBlock } from './ApprovalBlock';
import { DrawingSizeInfo } from './DrawingSizeInfo';
import { getCalculatedLayoutWidthMm, getRequestedLayoutWidthMm } from './drawingSizeMetrics';
import { DrawingSpecTable, SPEC_TABLE_WIDTH } from './DrawingSpecTable';

type Props = {
  config: ProductConfig;
  calculation: CalculationResult;
  forExport?: boolean;
};

const LEGEND_ITEM_H = 30;
const WIDTH_DIM_LINE_GAP = 20;

export const DrawingSheet = ({ config, calculation, forExport = false }: Props) => {
  const width = DRAWING_EXPORT_WIDTH;
  const height = DRAWING_EXPORT_HEIGHT;
  const cableLayout = calculation.cableLayout;
  const cableCount = cableLayout?.count ?? 0;

  const layout = computeSheetLayout({
    sheetW: width,
    hasCableAnnotation: Boolean(cableLayout && cableLayout.spacingsMm.length > 0),
  });

  const matLayout = buildLayoutGeometry(config, layout.matW, layout.matX);
  const layoutRects = matLayout.rects;
  const cableLinesY =
    cableLayout && config.totalLengthMm > 0
      ? cableYPositions(config.totalLengthMm, layout.matY, layout.matH, cableLayout.positionsMm)
      : [];
  const legendTypes = deriveLegendTypesFromStrips(
    config.strips,
    config.layoutPattern,
    config.autoFillEnabled ?? false,
  );
  const legendH = legendTypes.length > 0 ? 34 + legendTypes.length * LEGEND_ITEM_H + 16 : layout.legendH;
  const requestedWidthMm = getRequestedLayoutWidthMm(calculation);
  const calculatedWidthMm = getCalculatedLayoutWidthMm(calculation);
  const widthScale = matLayout.scale;
  const lengthPxPerMm = getLengthPxPerMm(layout.matH, config.totalLengthMm);
  const widthToX = (widthMm: number): number => layout.matX + widthMm * widthScale;
  const calculatedDimY = layout.widthDimY;
  const requestedDimY = layout.widthDimY - WIDTH_DIM_LINE_GAP;
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
        <ProfileTextureDefs widthScale={widthScale} lengthPxPerMm={lengthPxPerMm} idPrefix="drawing" />
        <rect x={20} y={20} width={width - 40} height={height - 40} fill="#fff" stroke="#111827" strokeWidth={1.5} />

        <text x={48} y={52} className="sheet-title">
          Технический лист грязезащитного покрытия
        </text>
        <text x={48} y={76} className="sheet-meta">{`Проект: ${config.projectName}`}</text>
        <text x={48} y={96} className="sheet-meta">{`Клиент: ${config.clientName || '—'} · Менеджер: ${config.managerName || '—'}`}</text>

        <ApprovalBlock
          x={layout.approvalX}
          y={layout.approvalY}
          width={layout.approvalW}
          year={new Date(config.updatedAt).getFullYear()}
        />

        <rect x={layout.matX} y={layout.matY} width={layout.matW} height={layout.matH} fill="#fff" stroke="#1f2937" />
        {layoutRects.map((rect, index) => {
          if (rect.kind === 'gap') {
            return (
              <rect
                key={`gap-${index}`}
                x={rect.x}
                y={layout.matY}
                width={rect.width}
                height={layout.matH}
                fill="#f8fafc"
                stroke="#94a3b8"
                strokeWidth={0.4}
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
              y={layout.matY}
              width={rect.width}
              height={layout.matH}
              lengthPxPerMm={lengthPxPerMm}
              stroke="#334155"
              strokeWidth={0.7}
              idPrefix="drawing"
            />
          );
        })}

        {cableLinesY.map((y, index) => (
          <line
            key={`cable-guide-${index}`}
            x1={layout.matX}
            y1={y}
            x2={layout.matX + layout.matW}
            y2={y}
            stroke="#cbd5e1"
            strokeWidth={0.45}
            strokeDasharray="6 5"
          />
        ))}

        <HorizontalDimension
          x1={layout.matX}
          x2={widthToX(requestedWidthMm)}
          y={requestedDimY}
          objectY1={layout.matY}
          objectY2={layout.matY}
          label={`Запрашиваемый ${Math.round(requestedWidthMm)}`}
        />
        <HorizontalDimension
          x1={layout.matX}
          x2={widthToX(calculatedWidthMm)}
          y={calculatedDimY}
          objectY1={layout.matY}
          objectY2={layout.matY}
          label={`Расчетный ${Math.round(calculatedWidthMm)}`}
        />

        <VerticalDimension
          x={layout.lengthDimX}
          y1={layout.matY}
          y2={layout.matY + layout.matH}
          objectX1={layout.matX + layout.matW}
          objectX2={layout.matX + layout.matW}
          label={`${config.totalLengthMm.toFixed(0)}`}
          labelOffset={11}
        />

        {cableLayout && cableLayout.spacingsMm.length > 0 && (
          <CableSpacingAnnotation
            matX={layout.matX}
            matY={layout.matY}
            matH={layout.matH}
            totalLengthMm={config.totalLengthMm}
            edgeOffsetMm={cableLayout.edgeOffsetMm}
            spacingsMm={cableLayout.spacingsMm}
          />
        )}

        <rect
          x={layout.legendX}
          y={layout.legendY}
          width={layout.legendW}
          height={legendH}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth={1}
          rx={6}
        />
        <text x={layout.legendX + 14} y={layout.legendY + 22} className="sheet-subtitle">
          Легенда
        </text>
        {legendTypes.map((type, i) => (
          <g key={`legend-${i}-${type}`}>
            <ProfileStripGraphics
              type={type}
              x={layout.legendX + 14}
              y={layout.legendY + 34 + i * LEGEND_ITEM_H}
              width={20}
              height={14}
              lengthPxPerMm={lengthPxPerMm}
              stroke="#475569"
              strokeWidth={0.6}
              idPrefix="drawing"
            />
            <text
              x={layout.legendX + 42}
              y={layout.legendY + 45 + i * LEGEND_ITEM_H}
              className="sheet-meta sheet-meta--legend"
            >
              {moduleDefinitions[type].shortName}
            </text>
          </g>
        ))}

        <text x={48} y={layout.specY} className="sheet-subtitle">
          Спецификация
        </text>
        <DrawingSpecTable x={48} y={layout.specY + 14} calculation={calculation} cableCount={cableCount} />
        <DrawingSizeInfo
          x={48 + SPEC_TABLE_WIDTH + 32}
          y={layout.specY + 28}
          config={config}
          calculation={calculation}
        />
      </svg>
    </div>
  );
};
