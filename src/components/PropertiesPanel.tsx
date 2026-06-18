import { derivePatternFromStrips, getDisplayLayoutPattern } from '../domain/layoutRules';
import { moduleTypeOrder, moduleDefinitions } from '../domain/moduleDefinitions';
import { PIT_INSET_MM, MAX_ORDER_DIMENSION_MM, MIN_ORDER_DIMENSION_MM } from '../domain/constants';
import {
  carpetLengthHint,
  carpetLengthLabel,
  carpetWidthHint,
  carpetWidthLabel,
} from '../domain/dimensionLabels';
import {
  isNarrowWidthDiscountEligible,
  NARROW_WIDTH_DISCOUNT_THRESHOLD_MM,
} from '../domain/pricing';
import type { DimensionSource, ProductConfig, Strip } from '../domain/types';
import { NumericMmField } from './NumericMmField';

type Props = {
  config: ProductConfig;
  selectedStrip?: Strip;
  onDimension: (
    key: 'orderWidthMm' | 'orderLengthMm' | 'defaultStripWidthMm' | 'cableEdgeOffsetMm' | 'dimensionSource',
    value: number | DimensionSource,
  ) => void;
  onFitToOrderSize: (value: boolean) => void;
  onNarrowWidthDiscount: (value: boolean) => void;
  onClientName: (value: string) => void;
  onManagerName: (value: string) => void;
  onUpdateStrip: (key: 'type' | 'widthMm', value: string | number) => void;
  onAutoFill: () => void;
  onClearAll: () => void;
};

export const PropertiesPanel = ({
  config,
  selectedStrip,
  onDimension,
  onFitToOrderSize,
  onNarrowWidthDiscount,
  onClientName,
  onManagerName,
  onUpdateStrip,
  onAutoFill,
  onClearAll,
}: Props) => {
  const selectedIndex = selectedStrip ? config.strips.findIndex((strip) => strip.id === selectedStrip.id) : -1;
  const isEdgeStrip = selectedIndex === 0 || selectedIndex === config.strips.length - 1;
  const seedPattern = derivePatternFromStrips(config.strips);
  const displayPattern = getDisplayLayoutPattern(
    config.strips,
    config.layoutPattern,
    config.autoFillEnabled ?? false,
  );
  const layoutPatternLabel =
    displayPattern.length > 0
      ? displayPattern.map((type) => moduleDefinitions[type].shortName).join(' → ')
      : undefined;
  const narrowWidthDiscountEligible = isNarrowWidthDiscountEligible(config.totalLengthMm);

  return (
  <section className="panel panel-properties">
    <h2>Параметры</h2>

    <label>Источник размеров</label>
    <select
      className="field-full"
      value={config.dimensionSource}
      onChange={(event) => onDimension('dimensionSource', event.target.value as DimensionSource)}
    >
      <option value="carpet">Размер ковра</option>
      <option value="pit">Размер приямка (−{PIT_INSET_MM} мм к габариту)</option>
    </select>

    <label>{carpetWidthLabel(config.dimensionSource)}</label>
    <NumericMmField
      value={config.orderLengthMm}
      min={MIN_ORDER_DIMENSION_MM}
      max={MAX_ORDER_DIMENSION_MM}
      fractionDigits={0}
      onCommit={(value) => onDimension('orderLengthMm', value)}
    />
    {config.dimensionSource === 'pit' && <p className="muted">{carpetWidthHint(config.totalLengthMm)}</p>}

    <label>{carpetLengthLabel(config.dimensionSource)}</label>
    <NumericMmField
      value={config.orderWidthMm}
      min={MIN_ORDER_DIMENSION_MM}
      max={MAX_ORDER_DIMENSION_MM}
      fractionDigits={0}
      onCommit={(value) => onDimension('orderWidthMm', value)}
    />
    {config.dimensionSource === 'pit' && <p className="muted">{carpetLengthHint(config.totalWidthMm)}</p>}
    <p className="muted">
      Допустимый габарит: {MIN_ORDER_DIMENSION_MM}–{MAX_ORDER_DIMENSION_MM} мм (макс.{' '}
      {MAX_ORDER_DIMENSION_MM / 1000}×{MAX_ORDER_DIMENSION_MM / 1000} м).
    </p>

    <label className="checkbox-row">
      <input
        type="checkbox"
        checked={config.fitToOrderSize ?? false}
        onChange={(event) => onFitToOrderSize(event.target.checked)}
      />
      Подогнать под размер заказчика
    </label>

    <label className="checkbox-row">
      <input
        type="checkbox"
        checked={config.narrowWidthDiscountEnabled ?? false}
        disabled={!narrowWidthDiscountEligible}
        onChange={(event) => onNarrowWidthDiscount(event.target.checked)}
      />
      Скидка −10%
    </label>
    {!narrowWidthDiscountEligible && (
      <p className="muted">Скидка доступна при ширине ковра менее {NARROW_WIDTH_DISCOUNT_THRESHOLD_MM} мм.</p>
    )}

    <label>Клиент</label>
    <input className="field-full" value={config.clientName || ''} onChange={(event) => onClientName(event.target.value)} />
    <label>Менеджер</label>
    <input className="field-full" value={config.managerName || ''} onChange={(event) => onManagerName(event.target.value)} />

    <h3>Выбранный профиль</h3>
    {!selectedStrip ? (
      <p>Выберите полосу в конструкторе.</p>
    ) : (
      <>
        <label>Профиль</label>
        <select className="field-full" value={selectedStrip.type} onChange={(event) => onUpdateStrip('type', event.target.value)}>
          {moduleTypeOrder.map((type) => (
            <option key={type} value={type} disabled={isEdgeStrip && type === 'scraper'}>
              {moduleDefinitions[type].shortName}
            </option>
          ))}
        </select>
      </>
    )}

    <h3>Автозаполнение остатка</h3>
    {layoutPatternLabel && <p className="muted">Комбинация: {layoutPatternLabel}</p>}
    <button
      type="button"
      className="field-full btn-autofill"
      onClick={onAutoFill}
      disabled={seedPattern.length === 0}
      title="Повторяет комбинацию профилей на полотне до заказной длины. После автозаполнения при смене длины ковра раскладка пересчитается автоматически."
    >
      Автозаполнить остаток
    </button>
    <button type="button" className="field-full danger" onClick={onClearAll} disabled={config.strips.length === 0}>
      Очистить всё
    </button>
  </section>
  );
};
