import { describe, expect, it } from 'vitest';
import { MODULE_GAP_MM, PLANK_WIDTH_MM, SCRAPER_WIDTH_MM } from './constants';
import { computeCableLayout, buildManualCableLayout, resolveCableLayout, getValidSpacingsForManualCount, syncManualCableSettings } from './cableLayout';
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
import { formatCarpetCountNoun, formatCarpetCountSuffix } from './carpetCount';
import { getModuleUnitPrice, pricingConfig } from './pricing';
import type { ModuleType, ProductConfig, ProfileGrade, Strip } from './types';

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

const grades: ProfileGrade[] = ['standard', 'reinforced'];

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
    const layout = buildManualCableLayout(2000, 6, 360);
    expect(layout).toEqual({
      positionsMm: [100, 460, 820, 1180, 1540, 1900],
      spacingsMm: [360, 360, 360, 360, 360],
      edgeOffsetMm: 100,
      count: 6,
    });
  });

  it('for 1500 mm only 400 mm spacing fits 4 cables', () => {
    expect(getValidSpacingsForManualCount(1500, 4)).toEqual([400]);
    const layout = buildManualCableLayout(1500, 4, 400);
    expect(layout?.edgeOffsetMm).toBe(150);
  });

  it('syncManualCableSettings picks nearest valid count and spacing', () => {
    expect(syncManualCableSettings(1500, 4, 300)).toEqual({
      manualCableCount: 4,
      manualCableSpacingMm: 400,
    });
  });

  it('resolveCableLayout uses manual settings when mode is manual', () => {
    const layout = resolveCableLayout(2000, {
      mode: 'manual',
      manualCount: 6,
      manualSpacingMm: 360,
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
    for (const grade of grades) {
      expect(result.narrowWidthDiscountAmount[grade]).toBeCloseTo(result.subtotalPrice[grade] * 0.1);
      expect(result.totalPrice[grade]).toBeCloseTo(result.subtotalPrice[grade] * 0.9);
    }
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
    expect(result.totalPrice).toEqual(result.subtotalPrice);
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
    expect(result.narrowWidthDiscountAmount).toEqual({ standard: 0, reinforced: 0 });
    expect(result.totalPrice).toEqual(result.subtotalPrice);
  });

  it('calculates a carpet longer than 3000 mm', () => {
    const config = makeConfig({
      orderWidthMm: 4500,
      totalWidthMm: 4500,
      strips: rebuildLayoutToTargetWidth(['rubber', 'pile'], 4500),
    });
    const result = calculateConfig(config);
    expect(result.orderTargetWidthMm).toBe(4500);
    expect(result.totalAreaM2).toBeGreaterThan(0);
    expect(result.cableLayout?.count).toBeGreaterThan(0);
  });

  it('multiplies area, price and fittings by carpet count', () => {
    const strips = rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000);
    const one = calculateConfig(makeConfig({ strips, carpetCount: 1 }));
    const three = calculateConfig(makeConfig({ strips, carpetCount: 3 }));
    expect(three.carpetCount).toBe(3);
    expect(three.totalAreaM2).toBeCloseTo(one.totalAreaM2 * 3);
    expect(three.plugCount).toBe(one.plugCount * 3);
    expect(three.bushingCount).toBe(one.bushingCount * 3);
    expect(three.cableLayout?.count).toBe(one.cableLayout?.count);
    for (const grade of grades) {
      expect(three.totalPrice[grade]).toBeCloseTo(one.totalPrice[grade] * 3);
    }
    const rubberOne = one.byType.find((row) => row.type === 'rubber')?.count ?? 0;
    const rubberThree = three.byType.find((row) => row.type === 'rubber')?.count ?? 0;
    expect(rubberThree).toBe(rubberOne * 3);
  });
});

describe('pricing (прайс от 01.04.26, розница ₽/м² с НДС)', () => {
  const retailPrices: Record<ProfileGrade, Record<ModuleType, number>> = {
    standard: { rubber: 15372, pile: 16470, brush: 29097, scraper: 17019 },
    reinforced: { rubber: 17400, pile: 18450, brush: 32625, scraper: 17019 },
  };

  it('matches the price list for both profile grades', () => {
    expect(pricingConfig.modulePricesPerM2).toEqual(retailPrices);
  });

  it('resolves unit price by module type and grade', () => {
    for (const grade of grades) {
      for (const type of Object.keys(retailPrices[grade]) as ModuleType[]) {
        expect(getModuleUnitPrice(type, grade)).toBe(retailPrices[grade][type]);
      }
    }
  });

  it('keeps a single scraper price across grades', () => {
    expect(getModuleUnitPrice('scraper', 'reinforced')).toBe(getModuleUnitPrice('scraper', 'standard'));
  });
});

describe('calculations report both profile grades', () => {
  const result = calculateConfig(
    makeConfig({ strips: rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000) }),
  );

  it('exposes unit prices of both grades for every module type', () => {
    expect(result.byType.find((row) => row.type === 'rubber')?.unitPrice).toEqual({
      standard: 15372,
      reinforced: 17400,
    });
    expect(result.byType.find((row) => row.type === 'pile')?.unitPrice).toEqual({
      standard: 16470,
      reinforced: 18450,
    });
  });

  it('prices the same area twice, reinforced above standard', () => {
    expect(result.totalPrice.reinforced).toBeGreaterThan(result.totalPrice.standard);
    for (const grade of grades) {
      const expected = result.byType.reduce((sum, row) => sum + row.areaM2 * row.unitPrice[grade], 0);
      expect(result.totalPrice[grade]).toBeCloseTo(expected);
    }
  });

  it('leaves the layout itself independent of the grade', () => {
    expect(result.totalAreaM2).toBeGreaterThan(0);
    expect(result.byType.every((row) => row.price.standard <= row.price.reinforced)).toBe(true);
  });
});

describe('drawingLayout', () => {
  it('insets the right column so its blocks do not touch the frame line', async () => {
    const { computeSheetLayout } = await import('../renderers/drawingLayout');
    const { getFrameBounds } = await import('../renderers/DrawingFrame');

    const layout = computeSheetLayout({ hasCableAnnotation: false });
    const frame = getFrameBounds();

    expect(layout.rightColX).toBeGreaterThan(frame.left);
    expect(layout.rightColX + layout.rightColW).toBeLessThan(frame.right);
  });

  it('aligns the size info, approval block and spec table on one right edge', async () => {
    const { computeSheetLayout } = await import('../renderers/drawingLayout');

    const layout = computeSheetLayout({ hasCableAnnotation: false });
    const columnRight = layout.rightColX + layout.rightColW;

    expect(layout.approvalX).toBe(layout.rightColX);
    expect(layout.specX).toBe(layout.rightColX);
    expect(layout.sizeInfoX).toBe(columnRight);
  });

  it('reserves extra room for the kant size line', async () => {
    const { computeSheetLayout } = await import('../renderers/drawingLayout');
    const withoutKant = computeSheetLayout({ hasCableAnnotation: false });
    const withKant = computeSheetLayout({ hasCableAnnotation: false, hasKantSizeLine: true });
    expect(withKant.specY).toBeGreaterThan(withoutKant.specY);
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

describe('carpetCount', () => {
  it('declines noun by number', () => {
    expect(formatCarpetCountNoun(1)).toBe('ковёр');
    expect(formatCarpetCountNoun(2)).toBe('ковра');
    expect(formatCarpetCountNoun(5)).toBe('ковров');
    expect(formatCarpetCountNoun(21)).toBe('ковёр');
    expect(formatCarpetCountNoun(22)).toBe('ковра');
    expect(formatCarpetCountNoun(11)).toBe('ковров');
  });

  it('adds calculation suffix only when count is greater than one', () => {
    expect(formatCarpetCountSuffix(1)).toBeUndefined();
    expect(formatCarpetCountSuffix(3)).toBe('за 3 ковра');
    expect(formatCarpetCountSuffix(5)).toBe('за 5 ковров');
  });
});

describe('outer kant', () => {
  it('adds 50 mm on each side and prices the outer perimeter', async () => {
    const { getKantMetrics, KANT_PRICE_PER_LINEAR_METER, KANT_WIDTH_MM } = await import('./kant');
    const metrics = getKantMetrics(true, 1000, 1500, 1);
    expect(KANT_WIDTH_MM).toBe(50);
    expect(metrics.overallWidthMm).toBe(1100);
    expect(metrics.overallLengthMm).toBe(1600);
    expect(metrics.linearMeters).toBeCloseTo(5.4);
    expect(metrics.price).toBeCloseTo(5.4 * KANT_PRICE_PER_LINEAR_METER);
  });

  it('is ignored when disabled', async () => {
    const { getKantMetrics } = await import('./kant');
    const metrics = getKantMetrics(false, 1000, 1500, 2);
    expect(metrics.enabled).toBe(false);
    expect(metrics.overallWidthMm).toBe(1000);
    expect(metrics.overallLengthMm).toBe(1500);
    expect(metrics.price).toBe(0);
  });

  it('does not apply for pit dimensions even if the flag is on', async () => {
    const { isOuterKantEnabled } = await import('./kant');
    expect(isOuterKantEnabled(true, 'carpet')).toBe(true);
    expect(isOuterKantEnabled(true, 'pit')).toBe(false);
  });

  it('adds kant price to both profile grades after the narrow-width discount', () => {
    const strips = rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000);
    const base = calculateConfig(makeConfig({ strips, hasOuterKant: false }));
    const withKant = calculateConfig(makeConfig({ strips, hasOuterKant: true }));
    expect(withKant.kantEnabled).toBe(true);
    expect(withKant.kantWidthMm).toBe(50);
    expect(withKant.kantOverallWidthMm).toBe(withKant.nominalLayoutWidthMm + 100);
    expect(withKant.kantOverallLengthMm).toBe(1600);
    for (const grade of grades) {
      expect(withKant.totalPrice[grade]).toBeCloseTo(base.totalPrice[grade] + withKant.kantPrice);
    }
    expect(withKant.subtotalPrice).toEqual(base.subtotalPrice);
  });

  it('adds kant to the calculated layout size, not the ordered size', () => {
    const strips = rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000);
    const result = calculateConfig(makeConfig({ strips, hasOuterKant: true }));
    expect(result.nominalLayoutWidthMm).toBeLessThan(1000);
    expect(result.kantOverallWidthMm).toBe(result.nominalLayoutWidthMm + 100);
    expect(result.kantOverallLengthMm).toBe(result.orderTargetLengthMm + 100);
  });

  it('does not discount the kant and scales with carpet count', () => {
    const strips = rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000);
    const one = calculateConfig(
      makeConfig({
        strips,
        hasOuterKant: true,
        narrowWidthDiscountEnabled: true,
        orderLengthMm: 1100,
        totalLengthMm: 1100,
        carpetCount: 1,
      }),
    );
    const two = calculateConfig(
      makeConfig({
        strips,
        hasOuterKant: true,
        narrowWidthDiscountEnabled: true,
        orderLengthMm: 1100,
        totalLengthMm: 1100,
        carpetCount: 2,
      }),
    );
    expect(one.narrowWidthDiscountApplied).toBe(true);
    expect(two.kantPrice).toBeCloseTo(one.kantPrice * 2);
    expect(two.kantLinearMeters).toBeCloseTo(one.kantLinearMeters * 2);
    for (const grade of grades) {
      expect(two.totalPrice[grade]).toBeCloseTo(one.totalPrice[grade] * 2);
    }
  });

  it('insets the layout by the kant width', async () => {
    const { buildLayoutGeometry } = await import('../renderers/layoutGeometry');
    const { KANT_WIDTH_MM } = await import('./kant');
    const config = makeConfig({
      hasOuterKant: true,
      strips: rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000),
    });
    const layout = buildLayoutGeometry(config, 800, 400, 0, 0, { fit: 'contain', align: 'center' });
    expect(layout.kantEnabled).toBe(true);
    expect(layout.overallLengthMm).toBe(config.totalLengthMm + 2 * KANT_WIDTH_MM);
    expect(layout.overallWidthMm).toBe(layout.layoutWidthMm + 2 * KANT_WIDTH_MM);
    expect(layout.matX).toBeCloseTo(layout.outerX + layout.kantPx);
    expect(layout.matY).toBeCloseTo(layout.outerY + layout.kantPx);
    expect(layout.matWidthPx).toBeCloseTo(layout.outerWidthPx - 2 * layout.kantPx);
    expect(layout.matHeightPx).toBeCloseTo(layout.outerHeightPx - 2 * layout.kantPx);
  });

  it('lists kant in the drawing spec table', async () => {
    const { buildSpecRows } = await import('../renderers/drawingSpecTableData');
    const strips = rebuildLayoutToTargetWidth(['rubber', 'pile'], 1000);
    const calculation = calculateConfig(makeConfig({ strips, hasOuterKant: true, carpetCount: 2 }));
    const rows = buildSpecRows(calculation, calculation.cableLayout?.count ?? 0);
    expect(rows.some((row) => row.label === 'Кант (обрамление)' && row.count === 8)).toBe(true);
  });
});

describe('carpet dimension clamps', () => {
  it('limits carpet width to 100–3000 mm', async () => {
    const { clampCarpetWidthMm } = await import('./numbers');
    expect(clampCarpetWidthMm(50)).toBe(100);
    expect(clampCarpetWidthMm(1500)).toBe(1500);
    expect(clampCarpetWidthMm(3500)).toBe(3000);
  });

  it('allows carpet length above 3000 mm', async () => {
    const { clampCarpetLengthMm } = await import('./numbers');
    expect(clampCarpetLengthMm(50)).toBe(100);
    expect(clampCarpetLengthMm(4500)).toBe(4500);
    expect(clampCarpetLengthMm(80_000)).toBe(50_000);
  });
});

describe('formatAllowance', () => {
  it('formats symmetric allowance', async () => {
    const { formatAllowance } = await import('./formatAllowance');
    expect(formatAllowance(7, 7)).toBe('±7 мм');
    expect(formatAllowance(7, 12)).toBe('±7–12 мм');
  });
});
