import { describe, expect, it } from 'vitest';
import { MODULE_GAP_MM, PLANK_WIDTH_MM, SCRAPER_WIDTH_MM } from './constants';
import {
  computeLayoutWidth,
  countPlugs,
  createStrip,
  deriveLegendTypesFromStrips,
  getStripNominalWidth,
  patternHasScraperAtEdge,
  rebuildLayoutToTargetWidth,
} from './layoutRules';
import { resolveLayoutDimensions } from './gapFit';
import { calculateConfig } from './calculations';
import type { ProductConfig, Strip } from './types';

const makeConfig = (partial: Partial<ProductConfig> = {}): ProductConfig => ({
  id: 'test',
  projectName: 'Test',
  orderWidthMm: 1000,
  orderLengthMm: 1500,
  totalWidthMm: 1000,
  totalLengthMm: 1500,
  dimensionSource: 'carpet',
  defaultStripWidthMm: PLANK_WIDTH_MM,
  fitToOrderSize: false,
  strips: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...partial,
});

const strip = (type: Strip['type'], widthMm = getStripNominalWidth(type)): Strip => ({
  id: `${type}-1`,
  type,
  widthMm,
});

describe('layoutRules', () => {
  it('computes layout width with gaps between strips', () => {
    const strips = [strip('rubber'), strip('pile')];
    expect(computeLayoutWidth(strips)).toBe(PLANK_WIDTH_MM * 2 + MODULE_GAP_MM);
  });

  it('rejects scraper at pattern edge', () => {
    expect(patternHasScraperAtEdge(['scraper', 'rubber'])).toBe(true);
    expect(patternHasScraperAtEdge(['rubber', 'scraper'])).toBe(true);
    expect(patternHasScraperAtEdge(['rubber', 'pile'])).toBe(false);
  });

  it('fills target width by repeating pattern', () => {
    const strips = rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000);
    expect(strips.length).toBeGreaterThan(0);
    expect(computeLayoutWidth(strips)).toBeLessThanOrEqual(1000 + 0.01);
  });

  it('counts plugs for non-scraper strips only', () => {
    expect(countPlugs([strip('rubber'), strip('scraper')])).toBe(2);
  });

  it('creates strip with nominal width', () => {
    const rubber = createStrip('rubber');
    const scraper = createStrip('scraper');
    expect(rubber.widthMm).toBe(PLANK_WIDTH_MM);
    expect(scraper.widthMm).toBe(SCRAPER_WIDTH_MM);
  });

  it('derives legend order from left-to-right carpet cycle', () => {
    const pattern = ['rubber', 'scraper', 'brush'] as const;
    const types = Array.from({ length: 9 }, (_, index) => pattern[index % pattern.length]);
    const strips = types.map((type, index) => ({ id: `s-${index}`, type, widthMm: PLANK_WIDTH_MM }));
    expect(deriveLegendTypesFromStrips(strips)).toEqual(['rubber', 'scraper', 'brush']);
  });

  it('does not treat full strip list as legend cycle', () => {
    const pattern = ['brush', 'scraper', 'pile', 'rubber'] as const;
    const types = Array.from({ length: 20 }, (_, index) => pattern[index % pattern.length]);
    const strips = types.map((type, index) => ({ id: `s-${index}`, type, widthMm: PLANK_WIDTH_MM }));
    expect(deriveLegendTypesFromStrips(strips)).toEqual(['brush', 'scraper', 'pile', 'rubber']);
  });

  it('prefers saved layout pattern for legend', () => {
    const strips = rebuildLayoutToTargetWidth(['brush', 'scraper', 'pile'], 1000);
    expect(deriveLegendTypesFromStrips(strips, ['brush', 'scraper', 'pile'], true)).toEqual([
      'brush',
      'scraper',
      'pile',
    ]);
  });

  it('derives legend order for non-repeating layout without duplicates', () => {
    const strips = [
      { id: '1', type: 'rubber' as const, widthMm: PLANK_WIDTH_MM },
      { id: '2', type: 'pile' as const, widthMm: PLANK_WIDTH_MM },
      { id: '3', type: 'brush' as const, widthMm: PLANK_WIDTH_MM },
    ];
    expect(deriveLegendTypesFromStrips(strips)).toEqual(['rubber', 'pile', 'brush']);
  });
});

describe('gapFit', () => {
  it('reports remainder when layout is narrower than target', () => {
    const strips = [strip('rubber')];
    const resolved = resolveLayoutDimensions(strips, 1000, 1000, false);
    expect(resolved.remainderMm).toBeGreaterThan(0);
    expect(resolved.fitApplied).toBe(false);
  });

  it('applies fit when enabled and within compression allowance', () => {
    const strips = rebuildLayoutToTargetWidth(['rubber'], 993);
    const nominal = strips.reduce((sum, strip) => sum + strip.widthMm, 0) + (strips.length - 1) * MODULE_GAP_MM;
    const resolved = resolveLayoutDimensions(strips, 1000, 1000, true);
    expect(resolved.fitApplied).toBe(true);
    expect(resolved.effectiveWidthMm).toBeGreaterThan(nominal);
    expect(Math.abs(resolved.remainderMm)).toBeLessThanOrEqual(7);
  });
});

describe('calculations', () => {
  it('calculates area and cable layout for a simple config', () => {
    const config = makeConfig({
      strips: rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000),
    });
    const result = calculateConfig(config);
    expect(result.totalAreaM2).toBeGreaterThan(0);
    expect(result.cableLayout?.count).toBeGreaterThan(0);
    expect(result.plugCount).toBeGreaterThan(0);
  });
});

describe('formatAllowance', () => {
  it('formats symmetric allowance', async () => {
    const { formatAllowance } = await import('./formatAllowance');
    expect(formatAllowance(7, 7)).toBe('±7 мм');
    expect(formatAllowance(7, 12)).toBe('±7–12 мм');
  });
});
