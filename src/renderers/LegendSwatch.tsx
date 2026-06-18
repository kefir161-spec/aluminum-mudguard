import { profileTextureConfig } from '../data/profileTextures';
import { getExportImageHref } from '../export/profileImageCache';
import type { ModuleType } from '../domain/types';

type Props = {
  type: ModuleType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  forExport?: boolean;
};

/** Образец профиля для легенды — горизонтальная планка с текстурой. */
export const LegendSwatch = ({ type, x, y, width = 76, height = 22, forExport = false }: Props) => {
  const config = profileTextureConfig[type];
  if (!config.moduleSrc) {
    return (
      <rect x={x} y={y} width={width} height={height} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.6} rx={3} />
    );
  }

  const clipId = `legend-swatch-${type}-${Math.round(x)}-${Math.round(y)}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx={3} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill="#f8fafc" stroke="#94a3b8" strokeWidth={0.6} rx={3} />
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${x + width / 2}, ${y + height / 2}) rotate(90) translate(${-height / 2}, ${-width / 2})`}>
          <image
            href={forExport ? getExportImageHref(config.moduleSrc) : config.moduleSrc}
            x={0}
            y={0}
            width={height}
            height={width}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      </g>
    </g>
  );
};
