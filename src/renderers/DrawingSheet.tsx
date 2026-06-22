import { getScraperEdgeWarnings } from '../domain/layoutRules';
import { DRAWING_EXPORT_ID } from '../export/drawingExport';
import type { CalculationResult, ProductConfig } from '../domain/types';
import { getLengthPxPerMm } from '../data/profileTextures';
import {
  deriveDesignation,
  deriveProductName,
  ESKD_DOCUMENT_TITLE,
  ESKD_ORG_NAME,
  formatScaleLabel,
  LINE_THICK_PX,
  LINE_THIN_PX,
  mm,
  SHEET_HEIGHT_PX,
  SHEET_PX_PER_MM,
  SHEET_WIDTH_PX,
  snapStandardScale,
} from '../domain/eskd';
import { ProfileTextureDefs } from './ProfileTextureDefs';
import { ProfileStripGraphics } from './ProfileStripGraphics';
import { buildLayoutGeometry, cablePositionsAlongLength } from './layoutGeometry';
import { CableSpacingAnnotation, HorizontalDimension, VerticalDimension } from './DimensionLines';
import { computeSheetLayout } from './drawingLayout';
import { DrawingFrame } from './DrawingFrame';
import { TitleBlock } from './TitleBlock';
import { DrawingSpecTable } from './DrawingSpecTable';
import { ApprovalBlock } from './ApprovalBlock';
import { DrawingSizeInfo } from './DrawingSizeInfo';
import { buildLegendAnchors, LegendLeaderLines } from './LegendLeaderLines';

type Props = {
  config: ProductConfig;
  calculation: CalculationResult;
  forExport?: boolean;
};

export const DrawingSheet = ({ config, calculation, forExport = false }: Props) => {
  const width = SHEET_WIDTH_PX;
  const height = SHEET_HEIGHT_PX;
  const cableLayout = calculation.cableLayout;
  const cableCount = cableLayout?.count ?? 0;
  const hasCableAnnotation = Boolean(cableLayout && cableLayout.spacingsMm.length > 0);

  const layout = computeSheetLayout({ hasCableAnnotation });

  // Полотно максимально заполняет отведённую область (без уменьшения до стандартного масштаба).
  const matLayout = buildLayoutGeometry(config, layout.matW, layout.matH, layout.matX, layout.matY, {
    fit: 'contain',
    align: 'center',
    sizeFactor: 0.98,
  });
  const layoutRects = matLayout.rects;
  const lengthPxPerMm = getLengthPxPerMm(matLayout.matWidthPx, config.totalLengthMm);
  const drawnWidthMm = matLayout.scale > 0 ? matLayout.matHeightPx / matLayout.scale : 0;
  const legendAnchors = buildLegendAnchors(layoutRects, config.strips);

  const cableLinesX =
    cableLayout && config.totalLengthMm > 0
      ? cablePositionsAlongLength(
          config.totalLengthMm,
          matLayout.matX,
          matLayout.matWidthPx,
          cableLayout.positionsMm,
        )
      : [];

  const layoutComplete = !calculation.isUnderfilled;
  const drawingWarnings = getScraperEdgeWarnings(config.strips, layoutComplete);

  const naturalRatio = matLayout.scale / SHEET_PX_PER_MM;
  const scaleLabel = formatScaleLabel(snapStandardScale(naturalRatio));
  const designation = deriveDesignation(config);
  const productName = deriveProductName(config);
  const matRight = matLayout.matX + matLayout.matWidthPx;
  const legendLabelX = matRight + mm(5);
  const widthDimX = Math.min(layout.rightColX - mm(10), legendLabelX + mm(36));

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

        <DrawingFrame />

        <rect
          x={matLayout.matX}
          y={matLayout.matY}
          width={matLayout.matWidthPx}
          height={matLayout.matHeightPx}
          fill="#fff"
          stroke="#000"
          strokeWidth={LINE_THICK_PX}
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
                fill="#fff"
                stroke="#000"
                strokeWidth={LINE_THIN_PX}
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
              widthScale={matLayout.scale}
              lengthPxPerMm={lengthPxPerMm}
              lengthAlong="x"
              stroke="#000"
              strokeWidth={LINE_THIN_PX}
              idPrefix="drawing"
            />
          );
        })}

        {cableLinesX.map((lineX, index) => (
          <line
            key={`cable-axis-${index}`}
            x1={lineX}
            y1={matLayout.matY - mm(2)}
            x2={lineX}
            y2={matLayout.matY + matLayout.matHeightPx + mm(2)}
            stroke="#000"
            strokeWidth={LINE_THIN_PX}
            strokeDasharray="12 3 2 3"
          />
        ))}

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

        <HorizontalDimension
          x1={matLayout.matX}
          x2={matRight}
          y={layout.lengthDimY}
          objectY1={matLayout.matY + matLayout.matHeightPx}
          objectY2={matLayout.matY + matLayout.matHeightPx}
          label={`${Math.round(config.totalLengthMm)}`}
        />
        <VerticalDimension
          x={widthDimX}
          y1={matLayout.matY}
          y2={matLayout.matY + matLayout.matHeightPx}
          objectX1={matRight}
          objectX2={matRight}
          label={`${Math.round(drawnWidthMm)}`}
        />

        {legendAnchors.length > 0 && (
          <LegendLeaderLines matRight={matRight} anchors={legendAnchors} labelX={legendLabelX} />
        )}

        <ApprovalBlock
          x={layout.approvalX}
          y={layout.approvalY}
          width={layout.rightColW}
          year={new Date(config.updatedAt).getFullYear()}
        />

        <DrawingSizeInfo
          x={layout.sizeInfoX}
          y={layout.sizeInfoY}
          width={layout.rightColW}
          config={config}
          calculation={calculation}
        />

        <DrawingSpecTable
          x={layout.specX}
          y={layout.specY}
          calculation={calculation}
          cableCount={cableCount}
        />

        <TitleBlock
          x={layout.titleBlockX}
          y={layout.titleBlockY}
          designation={designation}
          productName={productName}
          documentTitle={ESKD_DOCUMENT_TITLE}
          scaleLabel={scaleLabel}
          developer={config.managerName ?? ''}
          orgName={ESKD_ORG_NAME}
        />
      </svg>
    </div>
  );
};
