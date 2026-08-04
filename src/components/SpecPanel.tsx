import type { CalculationResult, ProductConfig } from '../domain/types';
import { formatMoney, formatNumber } from '../domain/calculations';
import { moduleDefinitions } from '../domain/moduleDefinitions';

type Props = {
  config: ProductConfig;
  calculation: CalculationResult;
};

export const SpecPanel = ({ config, calculation }: Props) => {
  const rows = calculation.byType.filter((row) => row.count > 0);
  const cableText = calculation.cableLayout
    ? `${calculation.cableLayout.count} шт.${
        calculation.cableLayout.spacingsMm.length ? `, шаг ${calculation.cableLayout.spacingsMm.join(', ')} мм` : ''
      }`
    : 'не размещены';

  return (
    <div className="spec-panel">
      <h2 className="spec-panel__title">Спецификация</h2>
      <div className="spec-table-wrap">
        <table className="data-table data-table--spec">
          <thead>
            <tr>
              <th rowSpan={2}>№</th>
              <th rowSpan={2}>Профиль</th>
              <th rowSpan={2}>Планки, шт.</th>
              <th rowSpan={2}>Суммарная ширина, мм</th>
              <th rowSpan={2}>Длина планки, мм</th>
              <th rowSpan={2}>Площадь, м²</th>
              <th colSpan={2} className="spec-group">
                Стандарт
              </th>
              <th colSpan={2} className="spec-group">
                Усиленная
              </th>
            </tr>
            <tr>
              <th className="spec-group">Цена, ₽/м²</th>
              <th>Стоимость</th>
              <th className="spec-group">Цена, ₽/м²</th>
              <th>Стоимость</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.type}>
                <td>{index + 1}</td>
                <td>{moduleDefinitions[row.type].shortName}</td>
                <td>{row.count}</td>
                <td>{formatNumber(row.totalWidthMm, 1)}</td>
                <td>{formatNumber(config.totalLengthMm, 1)}</td>
                <td>{formatNumber(row.areaM2, 3)}</td>
                <td className="spec-group">{formatMoney(row.unitPrice.standard)}</td>
                <td>{formatMoney(row.price.standard)} ₽</td>
                <td className="spec-group">{formatMoney(row.unitPrice.reinforced)}</td>
                <td>{formatMoney(row.price.reinforced)} ₽</td>
              </tr>
            ))}
            {calculation.narrowWidthDiscountApplied && (
              <tr className="spec-summary-row">
                <td colSpan={6} className="spec-summary-label">
                  Скидка −{calculation.narrowWidthDiscountPercent}%
                </td>
                <td colSpan={2} className="spec-group">
                  −{formatMoney(calculation.narrowWidthDiscountAmount.standard)} ₽
                </td>
                <td colSpan={2} className="spec-group">
                  −{formatMoney(calculation.narrowWidthDiscountAmount.reinforced)} ₽
                </td>
              </tr>
            )}
            <tr className="spec-summary-row spec-summary-row--total">
              <td colSpan={6} className="spec-summary-label">
                Итого
              </td>
              <td colSpan={2} className="spec-group">
                {formatMoney(calculation.totalPrice.standard)} ₽
              </td>
              <td colSpan={2} className="spec-group">
                {formatMoney(calculation.totalPrice.reinforced)} ₽
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="spec-details">
        <p>
          <strong>Цены:</strong> розничные по прайсу от 01.04.26, ₽/м² с НДС, для стандартного и усиленного
          алюминиевого профиля.
        </p>
        <p>
          <strong>Комплектующие:</strong> заглушки — {calculation.plugCount} шт.; втулки — {calculation.bushingCount}{' '}
          шт.; тросы — {cableText}.
        </p>
        <p>
          <strong>Итоговая площадь:</strong> {formatNumber(calculation.totalAreaM2, 3)} м².
        </p>
      </div>
    </div>
  );
};
