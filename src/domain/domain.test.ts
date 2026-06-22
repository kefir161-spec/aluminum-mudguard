import { describe, expect, it } from 'vitest';
import { MODULE_GAP_MM, PLANK_WIDTH_MM, SCRAPER_WIDTH_MM } from './constants';
import { computeCableLayout, buildManualCableLayout, resolveCableLayout } from './cableLayout';
import {
  computeLayoutWidth,
  countPlugs,
  createStrip,
  deriveLegendTypesFromStrips,
  getStripNominalWidth,
  hasScraperAtEdge,
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

  it('does not end autofill layout with scraper when pattern ends with scraper', () => {
    const strips = rebuildLayoutToTargetWidth(['rubber', 'scraper'], 1000);
    expect(strips.length).toBeGreaterThan(0);
    expect(hasScraperAtEdge(strips)).toBe(false);
  });

  it('keeps interior scrapers when autofill pattern ends with scraper', () => {
    const strips = rebuildLayoutToTargetWidth(['rubber', 'scraper'], 1000);
    expect(strips.some((strip) => strip.type === 'scraper')).toBe(true);
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

describe('cableLayout', () => {
  it('places cables for 1200 mm length', () => {
    const layout = computeCableLayout(1200);
    expect(layout).not.toBeNull();
    expect(layout?.count).toBeGreaterThanOrEqual(2);
    expect(layout?.spacingsMm.every((spacing) => spacing >= 300 && spacing <= 400)).toBe(true);
  });

  it('places cables for 1180 mm carpet (приямок 1200)', () => {
    const layout = computeCableLayout(1180);
    expect(layout).not.toBeNull();
    expect(layout?.count).toBeGreaterThanOrEqual(2);
  });

  it('auto layout for 2000 mm prefers 7 cables at 300 mm', () => {
    const layout = computeCableLayout(2000);
    expect(layout).toEqual({
      positionsMm: [100, 400, 700, 1000, 1300, 1600, 1900],
      spacingsMm: [300, 300, 300, 300, 300, 300],
      edgeOffsetMm: 100,
      count: 7,
    });
  });

  it('manual layout for 2000 mm with 6 cables at 360 mm', () => {
    const layout = buildManualCableLayout(2000, 6, 360, 100);
    expect(layout).toEqual({
      positionsMm: [100, 460, 820, 1180, 1540, 1900],
      spacingsMm: [360, 360, 360, 360, 360],
      edgeOffsetMm: 100,
      count: 6,
    });
  });

  it('resolveCableLayout uses manual settings when mode is manual', () => {
    const layout = resolveCableLayout(2000, {
      mode: 'manual',
      manualCount: 6,
      manualSpacingMm: 360,
      edgeOffsetMm: 100,
    });
    expect(layout?.count).toBe(6);
    expect(layout?.spacingsMm).toEqual([360, 360, 360, 360, 360]);
  });

  it('resolveCableLayout defaults to auto', () => {
    const auto = computeCableLayout(2000);
    const resolved = resolveCableLayout(2000, { mode: 'auto' });
    expect(resolved).toEqual(auto);
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

  it('applies 10% narrow-width discount when enabled and carpet width is below 1200 mm', () => {
    const config = makeConfig({
      orderLengthMm: 1100,
      totalLengthMm: 1100,
      narrowWidthDiscountEnabled: true,
      strips: rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000),
    });
    const result = calculateConfig(config);
    expect(result.narrowWidthDiscountApplied).toBe(true);
    expect(result.narrowWidthDiscountPercent).toBe(10);
    expect(result.narrowWidthDiscountAmount).toBeCloseTo(result.subtotalPrice * 0.1);
    expect(result.totalPrice).toBeCloseTo(result.subtotalPrice * 0.9);
  });

  it('does not apply narrow-width discount when option is disabled', () => {
    const config = makeConfig({
      orderLengthMm: 1100,
      totalLengthMm: 1100,
      narrowWidthDiscountEnabled: false,
      strips: rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000),
    });
    const result = calculateConfig(config);
    expect(result.narrowWidthDiscountApplied).toBe(false);
    expect(result.totalPrice).toBe(result.subtotalPrice);
  });

  it('does not apply narrow-width discount at 1200 mm and above', () => {
    const config = makeConfig({
      orderLengthMm: 1200,
      totalLengthMm: 1200,
      narrowWidthDiscountEnabled: true,
      strips: rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000),
    });
    const result = calculateConfig(config);
    expect(result.narrowWidthDiscountApplied).toBe(false);
    expect(result.narrowWidthDiscountAmount).toBe(0);
    expect(result.totalPrice).toBe(result.subtotalPrice);
  });
});

describe('getSourceCapLengthPx', () => {
  it('keeps cap proportion from slice meta', async () => {
    const { getModuleLengthPx, getSourceCapLengthPx } = await import('../data/profileTextures');
    const moduleLengthPx = getModuleLengthPx(0.5);
    const capPx = getSourceCapLengthPx(moduleLengthPx);
    expect(capPx).toBeGreaterThan(0);
    expect(capPx).toBeLessThan(moduleLengthPx / 2);
  });
});

describe('clampOrderDimensionMm', () => {
  it('clamps order dimensions to 100–3000 mm', async () => {
    const { clampOrderDimensionMm } = await import('./numbers');
    expect(clampOrderDimensionMm(50)).toBe(100);
    expect(clampOrderDimensionMm(1500)).toBe(1500);
    expect(clampOrderDimensionMm(3500)).toBe(3000);
  });
});

describe('formatAllowance', () => {
  it('formats symmetric allowance', async () => {
    const { formatAllowance } = await import('./formatAllowance');
    expect(formatAllowance(7, 7)).toBe('±7 мм');
    expect(formatAllowance(7, 12)).toBe('±7–12 мм');
  });
});
