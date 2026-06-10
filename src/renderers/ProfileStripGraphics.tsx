import type { ModuleType } from '../domain/types';
import { getCapHeightPx, profileTextureConfig } from '../data/profileTextures';
import { getProfileMiddleFill } from './profileTextureFill';

type Props = {
  type: ModuleType;
  x: number;
  y: number;
  width: number;
  height: number;
  lengthPxPerMm: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  onClick?: () => void;
  idPrefix?: string;
};

const renderCompositeStrip = (
  type: ModuleType,
  props: Props,
  capHeightPx: number,
  middleHeight: number,
) => {
  const { x, y, width, height, idPrefix = 'profile', className, onClick } = props;
  const config = profileTextureConfig[type];
  const middleFill = getProfileMiddleFill(type, idPrefix);
  const clipId = `${idPrefix}-clip-${type}-${x}-${y}`;

  return (
    <g className={className} style={onClick ? { cursor: 'pointer' } : undefined}>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {config.capSrc && capHeightPx > 0 && (
          <image
            href={config.capSrc}
            x={x}
            y={y}
            width={width}
            height={capHeightPx}
            preserveAspectRatio="none"
          />
        )}

        <rect x={x} y={y + capHeightPx} width={width} height={middleHeight} fill={middleFill} />

        {config.capSrc && capHeightPx > 0 && (
          <g transform={`translate(${x}, ${y + height - capHeightPx}) scale(1, -1)`}>
            <image href={config.capSrc} x={0} y={0} width={width} height={capHeightPx} preserveAspectRatio="none" />
          </g>
        )}
      </g>

      {onClick && <rect x={x} y={y} width={width} height={height} fill="transparent" onClick={onClick} />}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
        pointerEvents="none"
      />
    </g>
  );
};

export const ProfileStripGraphics = (props: Props) => {
  const { type, x, y, width, height, lengthPxPerMm } = props;
  const config = profileTextureConfig[type];

  if (config.renderMode === 'fullModule' && config.moduleSrc) {
    return (
      <g className={props.className} style={props.onClick ? { cursor: 'pointer' } : undefined}>
        <image
          href={config.moduleSrc}
          x={x}
          y={y}
          width={width}
          height={height}
          preserveAspectRatio="none"
        />
        {props.onClick && (
          <rect x={x} y={y} width={width} height={height} fill="transparent" onClick={props.onClick} />
        )}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke={props.stroke}
          strokeWidth={props.strokeWidth}
          pointerEvents="none"
        />
      </g>
    );
  }

  const capHeightPx =
    config.capSrc && type !== 'scraper'
      ? Math.max(0, getCapHeightPx(lengthPxPerMm, height))
      : 0;
  const middleHeight = Math.max(0, height - capHeightPx * 2);

  return renderCompositeStrip(type, props, capHeightPx, middleHeight);
};
