import { moduleTypeOrder, moduleDefinitions } from '../domain/moduleDefinitions';
import {
  PIT_INSET_MM,
  MAX_ORDER_DIMENSION_MM,
  MIN_ORDER_DIMENSION_MM,
} from '../domain/constants';
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
import type { CableLayout, CableLayoutMode } from '../domain/cableLayout';
import { getValidManualCounts, getValidSpacingsForManualCount } from '../domain/cableLayout';
import type { DimensionSource, ProductConfig, Strip } from '../domain/types';
import { MAX_DRAWING_COMMENT_LENGTH } from '../domain/drawingComment';
import { MAX_CARPET_COUNT, MIN_CARPET_COUNT } from '../domain/carpetCount';
import { ModulePreviewThumb } from './ModulePreviewThumb';
import { NumericMmField } from './NumericMmField';
import { AccordionSection } from './ui/AccordionSection';
import { Panel } from './ui/Panel';
import { SectionHeader } from './ui/SectionHeader';

type Props = {
  config: ProductConfig;
  cableLayout: CableLayout | null;
  selectedStrip?: Strip;
  onDimension: (
    key: 'orderWidthMm' | 'orderLengthMm' | 'defaultStripWidthMm' | 'cableEdgeOffsetMm' | 'dimensionSource',
    value: number | DimensionSource,
  ) => void;
  onCableLayout: (
    partial: Partial<Pick<ProductConfig, 'cableLayoutMode' | 'manualCableCount' | 'manualCableSpacingMm'>>,
  ) => void;
  onFitToOrderSize: (value: boolean) => void;
  onNarrowWidthDiscount: (value: boolean) => void;
  onCarpetCount: (value: number) => void;
  onClientName: (value: string) => void;
  onManagerName: (value: string) => void;
  onDrawingComment: (value: string) => void;
  onUpdateStrip: (key: 'type' | 'widthMm', value: string | number) => void;
};

export const PropertiesPanel = ({
  config,
  cableLayout,
  selectedStrip,
  onDimension,
  onCableLayout,
  onFitToOrderSize,
  onNarrowWidthDiscount,
  onCarpetCount,
  onClientName,
  onManagerName,
  onDrawingComment,
  onUpdateStrip,
}: Props) => {
  const selectedIndex = selectedStrip ? config.strips.findIndex((strip) => strip.id === selectedStrip.id) : -1;
  const isEdgeStrip = selectedIndex === 0 || selectedIndex === config.strips.length - 1;
  const narrowWidthDiscountEligible = isNarrowWidthDiscountEligible(config.totalLengthMm);
  const isManualCableLayout = config.cableLayoutMode === 'manual';
  const validManualCounts = getValidManualCounts(config.totalLengthMm);
  const manualCableCount = config.manualCableCount ?? validManualCounts[0] ?? 2;
  const validManualSpacings = getValidSpacingsForManualCount(config.totalLengthMm, manualCableCount);
  const manualCableSpacingMm =
    config.manualCableSpacingMm ?? validManualSpacings[0] ?? cableLayout?.spacingsMm[0] ?? 300;

  return (
    <Panel className="properties-panel">
      <SectionHeader title="Параметры" subtitle="Настройка полотна и заказа" />

      <AccordionSection title="Размеры изделия" defaultOpen>
        <label className="ui-field-label" htmlFor="dimension-source">
          Источник размеров
        </label>
        <select
          id="dimension-source"
          className="ui-select"
          value={config.dimensionSource}
          onChange={(event) => onDimension('dimensionSource', event.target.value as DimensionSource)}
        >
          <option value="carpet">Размер ковра</option>
          <option value="pit">Размер приямка (−{PIT_INSET_MM} мм к габариту)</option>
        </select>

        <div className="dimension-fields">
          <div className="dimension-field">
            <label className="ui-field-label" htmlFor="order-length">
              {carpetWidthLabel(config.dimensionSource)}
            </label>
            <NumericMmField
              variant="mm"
              value={config.orderLengthMm}
              min={MIN_ORDER_DIMENSION_MM}
              max={MAX_ORDER_DIMENSION_MM}
              fractionDigits={0}
              onCommit={(value) => onDimension('orderLengthMm', value)}
            />
            {config.dimensionSource === 'pit' && <p className="field-hint">{carpetWidthHint(config.totalLengthMm)}</p>}
          </div>
          <div className="dimension-field">
            <label className="ui-field-label" htmlFor="order-width">
              {carpetLengthLabel(config.dimensionSource)}
            </label>
            <NumericMmField
              variant="mm"
              value={config.orderWidthMm}
              min={MIN_ORDER_DIMENSION_MM}
              max={MAX_ORDER_DIMENSION_MM}
              fractionDigits={0}
              onCommit={(value) => onDimension('orderWidthMm', value)}
            />
            {config.dimensionSource === 'pit' && <p className="field-hint">{carpetLengthHint(config.totalWidthMm)}</p>}
          </div>
        </div>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={config.fitToOrderSize ?? false}
            onChange={(event) => onFitToOrderSize(event.target.checked)}
          />
          <span>Подогнать под размер заказчика</span>
        </label>
      </AccordionSection>

      <AccordionSection title="Тросы" defaultOpen={false}>
        <label className="ui-field-label" htmlFor="cable-layout-mode">
          Режим раскладки
        </label>
        <select
          id="cable-layout-mode"
          className="ui-select"
          value={config.cableLayoutMode ?? 'auto'}
          onChange={(event) =>
            onCableLayout({ cableLayoutMode: event.target.value as CableLayoutMode })
          }
        >
          <option value="auto">Автоматически</option>
          <option value="manual">Вручную</option>
        </select>

        {!isManualCableLayout && cableLayout && (
          <p className="field-hint">
            {cableLayout.count} тросов, шаг {cableLayout.spacingsMm.join(', ') || '—'} мм, отступ{' '}
            {cableLayout.edgeOffsetMm} мм.
          </p>
        )}

        {isManualCableLayout && (
          <>
            {validManualCounts.length === 0 ? (
              <p className="field-hint field-hint--warning">
                Для длины {Math.round(config.totalLengthMm)} мм нет допустимых вариантов раскладки тросов.
              </p>
            ) : (
              <>
                <label className="ui-field-label" htmlFor="manual-cable-count">
                  Количество тросов
                </label>
                <select
                  id="manual-cable-count"
                  className="ui-select"
                  value={manualCableCount}
                  onChange={(event) =>
                    onCableLayout({ manualCableCount: Number(event.target.value) })
                  }
                >
                  {validManualCounts.map((count) => (
                    <option key={count} value={count}>
                      {count} шт.
                    </option>
                  ))}
                </select>

                {validManualSpacings.length > 0 && (
                  <>
                    <label className="ui-field-label" htmlFor="manual-cable-spacing">
                      Шаг между тросами
                    </label>
                    <select
                      id="manual-cable-spacing"
                      className="ui-select"
                      value={manualCableSpacingMm}
                      onChange={(event) =>
                        onCableLayout({ manualCableSpacingMm: Number(event.target.value) })
                      }
                    >
                      {validManualSpacings.map((spacing) => (
                        <option key={spacing} value={spacing}>
                          {spacing} мм
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {cableLayout && (
                  <p className="field-hint">
                    Отступ от края: {cableLayout.edgeOffsetMm} мм (рассчитывается автоматически).
                  </p>
                )}
              </>
            )}
          </>
        )}
      </AccordionSection>

      <div className="properties-section-gap">
        <h3 className="properties-group-title">Выбранный профиль</h3>
        {!selectedStrip ? (
          <div className="ui-empty-state">Выберите планку на полотне, чтобы изменить её тип.</div>
        ) : (
          <div className="selected-strip-card">
            <ModulePreviewThumb type={selectedStrip.type} />
            <div className="selected-strip-card__info">
              <strong>{moduleDefinitions[selectedStrip.type].shortName}</strong>
              <span className="field-hint">
                Планка {selectedIndex + 1} из {config.strips.length}
                {isEdgeStrip && ' · краевая'}
              </span>
              <label className="ui-field-label" htmlFor="strip-type">
                Тип профиля
              </label>
              <select
                id="strip-type"
                className="ui-select"
                value={selectedStrip.type}
                onChange={(event) => onUpdateStrip('type', event.target.value)}
              >
                {moduleTypeOrder.map((type) => (
                  <option key={type} value={type} disabled={isEdgeStrip && type === 'scraper'}>
                    {moduleDefinitions[type].shortName}
                    {isEdgeStrip && type === 'scraper' ? ' (недоступен на краю)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="properties-section-gap">
        <AccordionSection title="Данные заказа" defaultOpen={false}>
          <label className="ui-field-label" htmlFor="client-name">
            Клиент
          </label>
          <input
            id="client-name"
            className="ui-input"
            value={config.clientName || ''}
            onChange={(event) => onClientName(event.target.value)}
          />
          <label className="ui-field-label" htmlFor="manager-name">
            Менеджер
          </label>
          <input
            id="manager-name"
            className="ui-input"
            value={config.managerName || ''}
            onChange={(event) => onManagerName(event.target.value)}
          />
        </AccordionSection>

        <AccordionSection title="Дополнительно" defaultOpen={false}>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={config.narrowWidthDiscountEnabled ?? false}
              disabled={!narrowWidthDiscountEligible}
              onChange={(event) => onNarrowWidthDiscount(event.target.checked)}
            />
            <span>Скидка −10%</span>
          </label>
          {!narrowWidthDiscountEligible && (
            <p className="field-hint">Скидка доступна при ширине ковра менее {NARROW_WIDTH_DISCOUNT_THRESHOLD_MM} мм.</p>
          )}

          <label className="ui-field-label" htmlFor="carpet-count">
            Количество ковров
          </label>
          <NumericMmField
            value={config.carpetCount ?? 1}
            min={MIN_CARPET_COUNT}
            max={MAX_CARPET_COUNT}
            fractionDigits={0}
            className="ui-input"
            onCommit={onCarpetCount}
          />
          <p className="field-hint">Одинаковые изделия в заказе. Расчёт и комплектация умножаются.</p>

          <label className="ui-field-label" htmlFor="drawing-comment-text">
            Комментарий к чертежу
          </label>
          <textarea
            id="drawing-comment-text"
            className="ui-textarea"
            value={config.drawingComment ?? ''}
            maxLength={MAX_DRAWING_COMMENT_LENGTH}
            rows={4}
            placeholder="Появится в левом нижнем углу чертежа"
            onChange={(event) => onDrawingComment(event.target.value)}
          />
          <p className="field-hint">
            Осталось {MAX_DRAWING_COMMENT_LENGTH - (config.drawingComment?.length ?? 0)} симв.
          </p>
        </AccordionSection>
      </div>
    </Panel>
  );
};
