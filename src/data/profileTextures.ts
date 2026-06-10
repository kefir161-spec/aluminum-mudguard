import rubberModuleUrl from '../assets/profiles/rubber-module.png';
import pileModuleUrl from '../assets/profiles/pile-module.png';
import brushModuleUrl from '../assets/profiles/brush-module.png';
import scraperModuleUrl from '../assets/profiles/scraper-module.png';
import sliceMeta from '../assets/profiles/slice-meta.json';
import type { ModuleType } from '../domain/types';

export const profileTextureMeta = {
  referenceWidthMm: sliceMeta.referenceWidthMm,
  referenceCapHeightMm: sliceMeta.referenceCapHeightMm,
  referenceLengthMm: sliceMeta.referenceLengthMm,
  tileLengthMm: sliceMeta.tileLengthMm,
} as const;

export type ProfileRenderMode = 'fullModule' | 'composite';

export type ProfileTextureConfig = {
  renderMode: ProfileRenderMode;
  moduleSrc: string | null;
  capSrc: string | null;
  middleSrc: string | null;
};

export const profileTextureConfig: Record<ModuleType, ProfileTextureConfig> = {
  rubber: {
    renderMode: 'fullModule',
    moduleSrc: rubberModuleUrl,
    capSrc: null,
    middleSrc: null,
  },
  pile: {
    renderMode: 'fullModule',
    moduleSrc: pileModuleUrl,
    capSrc: null,
    middleSrc: null,
  },
  brush: {
    renderMode: 'fullModule',
    moduleSrc: brushModuleUrl,
    capSrc: null,
    middleSrc: null,
  },
  scraper: {
    renderMode: 'fullModule',
    moduleSrc: scraperModuleUrl,
    capSrc: null,
    middleSrc: null,
  },
};

export const getLengthPxPerMm = (stripHeightPx: number, totalLengthMm: number): number =>
  totalLengthMm > 0 ? stripHeightPx / totalLengthMm : 0;

/** Высота заглушки в px: физическая по мм, но не меньше читаемого минимума на экране. */
export const getCapHeightPx = (lengthPxPerMm: number, stripHeightPx: number): number => {
  const physical = profileTextureMeta.referenceCapHeightMm * lengthPxPerMm;
  const minVisible = Math.max(4, stripHeightPx * 0.018);
  const maxCap = Math.max(0, stripHeightPx / 2 - 1);
  return Math.min(maxCap, Math.max(physical, minVisible));
};

export const getTileHeightPx = (lengthPxPerMm: number): number =>
  profileTextureMeta.tileLengthMm * lengthPxPerMm;
