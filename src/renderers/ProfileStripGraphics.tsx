import type { MouseEvent, ReactElement } from 'react';
import type { ModuleType } from '../domain/types';
import {
  getCapLengthPx,
  getModuleLengthPx,
  getSourceCapLengthPx,
  getStripWidthPx,
  getTileLengthPx,
  profileTextureConfig,
} from '../data/profileTextures';
import { getProfileMiddleFill } from './profileTextureFill';

type Props = {
  type: ModuleType;
  x: number;
  y: number;
  width: number;
  height: number;
  widthScale: number;
  lengthPxPerMm: number;
  lengthAlong?: 'x' | 'y';
  variant?: 'strip' | 'legend';
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  onClick?: () => void;
  onContextMenu?: (event: MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  idPrefix?: string;
};

type InteractionProps = Pick<
  Props,
  'onClick' | 'onContextMenu' | 'onMouseEnter' | 'onMouseLeave' | 'stroke' | 'strokeWidth'
>;

type ModuleSliceParams = {
  moduleSrc: string;
  lengthAlong: 'x' | 'y';
  destX: number;
  destY: number;
  destLengthPx: number;
  crossSizePx: number;
  moduleLengthPx: number;
  sourceOffsetPx: number;
};

const TILE_SEAM_OVERLAP_PX = 1;

const renderInteractionLayer = (
  x: number,
  y: number,
  width: number,
  height: number,
  { onClick, onContextMenu, onMouseEnter, onMouseLeave, stroke, strokeWidth }: InteractionProps,
) => (
  <>
    {onClick && (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    )}
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      pointerEvents="none"
    />
  </>
);

/** Срез модуля с корректным смещением по исходному PNG (без зеркалирования). */
const renderModuleSlice = ({
  moduleSrc,
  lengthAlong,
  destX,
  destY,
  destLengthPx,
  crossSizePx,
  moduleLengthPx,
  sourceOffsetPx,
}: ModuleSliceParams): ReactElement => {
  const image = (
    <image
      href={moduleSrc}
      x={0}
      y={-sourceOffsetPx}
      width={crossSizePx}
      height={moduleLengthPx}
      preserveAspectRatio="none"
    />
  );

  if (lengthAlong === 'x') {
    return (
      <g
        transform={`translate(${destX + destLengthPx / 2}, ${destY + crossSizePx / 2}) rotate(90) translate(${-crossSizePx / 2}, ${-destLengthPx / 2})`}
      >
        {image}
      </g>
    );
  }

  return <g transform={`translate(${destX}, ${destY})`}>{image}</g>;
};

/** Середина полосы: повторяем только чистый участок ворса/рифления без заглушек. */
const renderMiddleSlices = (
  moduleSrc: string,
  props: Pick<Props, 'lengthAlong'>,
  baseX: number,
  baseY: number,
  middleLengthPx: number,
  crossSizePx: number,
  capLengthPx: number,
  tileLengthPx: number,
  moduleLengthPx: number,
): ReactElement[] => {
  const middleBandPx = Math.max(moduleLengthPx - capLengthPx * 2, 1);
  const seamlessTileStartPx = capLengthPx + Math.max(0, (middleBandPx - tileLengthPx) / 2);
  const slices: ReactElement[] = [];
  let destPos = 0;
  let sliceIndex = 0;

  while (destPos < middleLengthPx - 0.01) {
    const segLength = Math.min(tileLengthPx, middleLengthPx - destPos);
    const clipLength = Math.min(segLength + TILE_SEAM_OVERLAP_PX, middleLengthPx - destPos);
    const sourceOffset = seamlessTileStartPx + (destPos % tileLengthPx);
    const destX = props.lengthAlong === 'x' ? baseX + capLengthPx + destPos : baseX;
    const destY = props.lengthAlong === 'x' ? baseY : baseY + capLengthPx + destPos;

    const clipId = `mid-${Math.round(destX)}-${Math.round(destY)}-${sliceIndex}`;
    const clipRect =
      props.lengthAlong === 'x' ? (
        <rect x={destX} y={destY} width={clipLength} height={crossSizePx} />
      ) : (
        <rect x={destX} y={destY} width={crossSizePx} height={clipLength} />
      );

    slices.push(
      <g key={clipId}>
        <defs>
          <clipPath id={clipId}>{clipRect}</clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {renderModuleSlice({
            moduleSrc,
            lengthAlong: props.lengthAlong ?? 'y',
            destX,
            destY,
            destLengthPx: segLength,
            crossSizePx,
            moduleLengthPx,
            sourceOffsetPx: sourceOffset,
          })}
        </g>
      </g>,
    );

    destPos += segLength;
    sliceIndex += 1;
  }

  return slices;
};

const renderTiledModule = (type: ModuleType, moduleSrc: string, props: Props): ReactElement => {
  const {
    x,
    y,
    width,
    height,
    widthScale,
    lengthPxPerMm,
    lengthAlong = 'y',
    className,
    variant = 'strip',
    idPrefix = 'profile',
  } = props;

  const stripWidthPx = getStripWidthPx(type, widthScale);
  const tileLengthPx = getTileLengthPx(lengthPxPerMm);
  const lengthPx = lengthAlong === 'x' ? width : height;
  const crossPx = lengthAlong === 'x' ? height : width;
  const crossSizePx = Math.min(crossPx, stripWidthPx);
  const crossOffset = (crossPx - crossSizePx) / 2;
  const baseX = lengthAlong === 'x' ? x : x + crossOffset;
  const baseY = lengthAlong === 'x' ? y + crossOffset : y;
  const stripClipId = `${idPrefix}-${type}-${Math.round(x)}-${Math.round(y)}-clip`;

  if (variant === 'legend' || lengthPx < tileLengthPx * 0.5) {
    return (
      <g className={className} style={props.onClick ? { cursor: 'pointer' } : undefined}>
        <image
          href={moduleSrc}
          x={x}
          y={y}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid meet"
        />
        {renderInteractionLayer(x, y, width, height, props)}
      </g>
    );
  }

  const moduleLengthPx = getModuleLengthPx(lengthPxPerMm);
  const capLengthPx =
    type === 'scraper' ? 0 : getSourceCapLengthPx(moduleLengthPx);
  const middleLengthPx = Math.max(0, lengthPx - capLengthPx * 2);

  return (
    <g className={className} style={props.onClick ? { cursor: 'pointer' } : undefined}>
      <defs>
        <clipPath id={stripClipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${stripClipId})`}>
        {capLengthPx > 0.5 && (
          <g>
            <defs>
              <clipPath id={`${stripClipId}-cap-start`}>
                <rect
                  x={lengthAlong === 'x' ? baseX : baseX}
                  y={lengthAlong === 'x' ? baseY : baseY}
                  width={lengthAlong === 'x' ? capLengthPx : crossSizePx}
                  height={lengthAlong === 'x' ? crossSizePx : capLengthPx}
                />
              </clipPath>
            </defs>
            <g clipPath={`url(#${stripClipId}-cap-start)`}>
              {renderModuleSlice({
                moduleSrc,
                lengthAlong,
                destX: baseX,
                destY: baseY,
                destLengthPx: capLengthPx,
                crossSizePx,
                moduleLengthPx,
                sourceOffsetPx: 0,
              })}
            </g>
          </g>
        )}
        {middleLengthPx > 0.5 &&
          renderMiddleSlices(
            moduleSrc,
            { lengthAlong },
            baseX,
            baseY,
            middleLengthPx,
            crossSizePx,
            capLengthPx,
            tileLengthPx,
            moduleLengthPx,
          )}
        {capLengthPx > 0.5 && (
          <g>
            <defs>
              <clipPath id={`${stripClipId}-cap-end`}>
                <rect
                  x={lengthAlong === 'x' ? baseX + lengthPx - capLengthPx : baseX}
                  y={lengthAlong === 'x' ? baseY : baseY + lengthPx - capLengthPx}
                  width={lengthAlong === 'x' ? capLengthPx : crossSizePx}
                  height={lengthAlong === 'x' ? crossSizePx : capLengthPx}
                />
              </clipPath>
            </defs>
            <g clipPath={`url(#${stripClipId}-cap-end)`}>
              {renderModuleSlice({
                moduleSrc,
                lengthAlong,
                destX: lengthAlong === 'x' ? baseX + lengthPx - capLengthPx : baseX,
                destY: lengthAlong === 'x' ? baseY : baseY + lengthPx - capLengthPx,
                destLengthPx: capLengthPx,
                crossSizePx,
                moduleLengthPx,
                sourceOffsetPx: moduleLengthPx - capLengthPx,
              })}
            </g>
          </g>
        )}
      </g>
      {renderInteractionLayer(x, y, width, height, props)}
    </g>
  );
};

const renderCompositeStrip = (
  type: ModuleType,
  props: Props,
  capLengthPx: number,
  middleLengthPx: number,
) => {
  const {
    x,
    y,
    width,
    height,
    lengthAlong = 'y',
    idPrefix = 'profile',
    className,
    widthScale,
  } = props;
  const config = profileTextureConfig[type];
  const middleFill = getProfileMiddleFill(type, idPrefix);
  const clipId = `${idPrefix}-clip-${type}-${x}-${y}`;
  const capAlongX = lengthAlong === 'x';
  const stripWidthPx = getStripWidthPx(type, widthScale);
  const crossPx = capAlongX ? height : width;
  const crossSizePx = Math.min(crossPx, stripWidthPx);
  const crossOffset = (crossPx - crossSizePx) / 2;

  return (
    <g className={className} style={props.onClick ? { cursor: 'pointer' } : undefined}>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {config.capSrc && capLengthPx > 0 && !capAlongX && (
          <image
            href={config.capSrc}
            x={x + crossOffset}
            y={y}
            width={crossSizePx}
            height={capLengthPx}
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {config.capSrc && capLengthPx > 0 && capAlongX && (
          <image
            href={config.capSrc}
            x={x}
            y={y + crossOffset}
            width={capLengthPx}
            height={crossSizePx}
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {capAlongX ? (
          <rect
            x={x + capLengthPx}
            y={y + crossOffset}
            width={Math.max(0, width - capLengthPx * 2)}
            height={crossSizePx}
            fill={middleFill}
          />
        ) : (
          <rect
            x={x + crossOffset}
            y={y + capLengthPx}
            width={crossSizePx}
            height={middleLengthPx}
            fill={middleFill}
          />
        )}

        {config.capSrc && capLengthPx > 0 && !capAlongX && (
          <g transform={`translate(${x + crossOffset}, ${y + height - capLengthPx}) scale(1, -1)`}>
            <image href={config.capSrc} x={0} y={0} width={crossSizePx} height={capLengthPx} preserveAspectRatio="xMidYMid slice" />
          </g>
        )}

        {config.capSrc && capLengthPx > 0 && capAlongX && (
          <g transform={`translate(${x + width - capLengthPx}, ${y + crossOffset}) scale(-1, 1)`}>
            <image href={config.capSrc} x={0} y={0} width={capLengthPx} height={crossSizePx} preserveAspectRatio="xMidYMid slice" />
          </g>
        )}
      </g>

      {renderInteractionLayer(x, y, width, height, props)}
    </g>
  );
};

export const ProfileStripGraphics = (props: Props) => {
  const { type, width, height, lengthPxPerMm, lengthAlong = 'y' } = props;
  const config = profileTextureConfig[type];

  if (config.renderMode === 'fullModule' && config.moduleSrc) {
    return renderTiledModule(type, config.moduleSrc, props);
  }

  const crossPx = lengthAlong === 'x' ? height : width;
  const capLengthPx =
    config.capSrc && type !== 'scraper' ? Math.max(0, getCapLengthPx(lengthPxPerMm, crossPx)) : 0;
  const middleLengthPx = Math.max(0, (lengthAlong === 'x' ? width : height) - capLengthPx * 2);

  return renderCompositeStrip(type, props, capLengthPx, middleLengthPx);
};
