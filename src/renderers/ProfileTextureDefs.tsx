import { moduleTypeOrder } from '../domain/moduleDefinitions';
import { getStripNominalWidth } from '../domain/layoutRules';
import { getTileHeightPx, profileTextureConfig } from '../data/profileTextures';
import { getPatternFill } from './svgPatternFill';
import { SvgPatterns } from './SvgPatterns';

type Props = {
  widthScale: number;
  lengthPxPerMm: number;
  idPrefix?: string;
};

export const ProfileTextureDefs = ({ widthScale, lengthPxPerMm, idPrefix = 'profile' }: Props) => (
  <>
    <SvgPatterns />
    <defs>
      {moduleTypeOrder.map((type) => {
        const config = profileTextureConfig[type];
        const stripWidthMm = getStripNominalWidth(type);
        const stripWidthPx = stripWidthMm * widthScale;
        const tileHeightPx = getTileHeightPx(lengthPxPerMm);
        const patternId = `${idPrefix}-middle-${type}`;

        if (config.middleSrc) {
          return (
            <pattern
              key={type}
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={stripWidthPx}
              height={tileHeightPx}
            >
              <image
                href={config.middleSrc}
                width={stripWidthPx}
                height={tileHeightPx}
                preserveAspectRatio="none"
              />
            </pattern>
          );
        }

        return (
          <pattern
            key={type}
            id={patternId}
            patternUnits="userSpaceOnUse"
            width={stripWidthPx}
            height={tileHeightPx}
          >
            <rect width={stripWidthPx} height={tileHeightPx} fill={getPatternFill(type)} />
          </pattern>
        );
      })}
    </defs>
  </>
);

