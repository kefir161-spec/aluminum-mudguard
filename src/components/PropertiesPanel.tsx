import { derivePatternFromStrips, getDisplayLayoutPattern } from '../domain/layoutRules';
import { moduleTypeOrder, moduleDefinitions } from '../domain/moduleDefinitions';
import { PIT_INSET_MM } from '../domain/constants';
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

    <label>{config.dimensionSource === 'pit' ? 'Ширина приямка, мм' : 'Ширина ковра, мм'}</label>
    <NumericMmField
      value={config.orderWidthMm}
      min={100}
      fractionDigits={0}
      onCommit={(value) => onDimension('orderWidthMm', value)}
    />
    {config.dimensionSource === 'pit' && (
      <p className="muted">Ширина полотна ковра: {config.totalWidthMm.toFixed(0)} мм</p>
    )}

    <label>{config.dimensionSource === 'pit' ? 'Длина приямка, мм' : 'Длина ковра, мм'}</label>
    <NumericMmField
      value={config.orderLengthMm}
      min={100}
      fractionDigits={0}
      onCommit={(value) => onDimension('orderLengthMm', value)}
    />
    {config.dimensionSource === 'pit' && (
      <p className="muted">Длина полотна ковра: {config.totalLengthMm.toFixed(0)} мм</p>
    )}

    <label className="checkbox-row">
      <input
        type="checkbox"
        checked={config.fitToOrderSize ?? false}
        onChange={(event) => onFitToOrderSize(event.target.checked)}
      />
      Подогнать под размер заказчика
    </label>

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
      title="Повторяет комбинацию профилей на полотне до заказной ширины. После автозаполнения при смене ширины ковра раскладка пересчитается автоматически."
    >
      Автозаполнить остаток
    </button>
    <button type="button" className="field-full danger" onClick={onClearAll} disabled={config.strips.length === 0}>
      Очистить всё
    </button>
  </section>
  );
};
