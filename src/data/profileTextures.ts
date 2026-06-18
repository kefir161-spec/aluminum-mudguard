import rubberModuleUrl from '../assets/profiles/rubber-module.png';
import pileModuleUrl from '../assets/profiles/pile-module.png';
import brushModuleUrl from '../assets/profiles/brush-module.png';
import scraperModuleUrl from '../assets/profiles/scraper-module.png';
import rubberPaletteUrl from '../assets/profiles/palette-rubber.png';
import pilePaletteUrl from '../assets/profiles/palette-pile.png';
import brushPaletteUrl from '../assets/profiles/palette-brush.png';
import scraperPaletteUrl from '../assets/profiles/palette-scraper.png';
import sliceMeta from '../assets/profiles/slice-meta.json';
import { getStripNominalWidth } from '../domain/layoutRules';
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
  paletteSrc: string | null;
  capSrc: string | null;
  middleSrc: string | null;
};

export const profileTextureConfig: Record<ModuleType, ProfileTextureConfig> = {
  rubber: {
    renderMode: 'fullModule',
    moduleSrc: rubberModuleUrl,
    paletteSrc: rubberPaletteUrl,
    capSrc: null,
    middleSrc: null,
  },
  pile: {
    renderMode: 'fullModule',
    moduleSrc: pileModuleUrl,
    paletteSrc: pilePaletteUrl,
    capSrc: null,
    middleSrc: null,
  },
  brush: {
    renderMode: 'fullModule',
    moduleSrc: brushModuleUrl,
    paletteSrc: brushPaletteUrl,
    capSrc: null,
    middleSrc: null,
  },
  scraper: {
    renderMode: 'fullModule',
    moduleSrc: scraperModuleUrl,
    paletteSrc: scraperPaletteUrl,
    capSrc: null,
    middleSrc: null,
  },
};

export const getLengthPxPerMm = (stripLengthPx: number, totalLengthMm: number): number =>
  totalLengthMm > 0 ? stripLengthPx / totalLengthMm : 0;

/** Ширина профиля на экране (поперёк длины ковра), px. */
export const getStripWidthPx = (type: ModuleType, widthScale: number): number =>
  getStripNominalWidth(type) * widthScale;

/** Длина одного тайла текстуры вдоль ковра, px. */
export const getTileLengthPx = (lengthPxPerMm: number): number =>
  profileTextureMeta.tileLengthMm * lengthPxPerMm;

/** Длина заглушки в координатах исходного PNG (пропорционально эталонному модулю). */
export const getSourceCapLengthPx = (moduleLengthPx: number): number =>
  (sliceMeta.capPx / sliceMeta.moduleHeightPx) * moduleLengthPx;

/** Длина заглушки вдоль ковра, px. */
export const getCapLengthPx = (lengthPxPerMm: number, crossPx?: number): number => {
  const physical = profileTextureMeta.referenceCapHeightMm * lengthPxPerMm;
  if (crossPx === undefined) return physical;
  const minVisible = Math.max(3, crossPx * 0.2);
  const maxCap = Math.max(0, profileTextureMeta.referenceLengthMm * lengthPxPerMm * 0.45);
  return Math.min(maxCap, Math.max(physical, minVisible));
};

/** Длина эталонного модуля на экране, px. */
export const getModuleLengthPx = (lengthPxPerMm: number): number =>
  profileTextureMeta.referenceLengthMm * lengthPxPerMm;

/** @deprecated используйте getCapLengthPx */
export const getCapHeightPx = (lengthPxPerMm: number, stripHeightPx: number): number =>
  getCapLengthPx(lengthPxPerMm, stripHeightPx);

export const getTileHeightPx = (lengthPxPerMm: number): number =>
  profileTextureMeta.tileLengthMm * lengthPxPerMm;
