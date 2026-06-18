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
    <div className="spec-wrap">
      <h2>Спецификация</h2>
      <table className="table">
        <thead>
          <tr>
            <th>№</th>
            <th>Профиль</th>
            <th>Планки, шт.</th>
            <th>Суммарная ширина, мм</th>
            <th>Длина планки, мм</th>
            <th>Площадь, м²</th>
            <th>Цена, ₽/м²</th>
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
              <td>{formatMoney(row.unitPrice)}</td>
              <td>{formatMoney(row.price)} ₽</td>
            </tr>
          ))}
          {calculation.narrowWidthDiscountApplied && (
            <tr className="spec-summary-row">
              <td colSpan={7} className="spec-summary-label">
                Скидка −{calculation.narrowWidthDiscountPercent}%
              </td>
              <td>−{formatMoney(calculation.narrowWidthDiscountAmount)} ₽</td>
            </tr>
          )}
          <tr className="spec-summary-row spec-summary-row--total">
            <td colSpan={7} className="spec-summary-label">
              Итого
            </td>
            <td>{formatMoney(calculation.totalPrice)} ₽</td>
          </tr>
        </tbody>
      </table>
      <div className="spec-details">
        <p>
          <strong>Комплектующие:</strong> заглушки — {calculation.plugCount} шт.; втулки —{' '}
          {calculation.bushingCount} шт.; тросы — {cableText}.
        </p>
        <p>
          <strong>Итоговая площадь:</strong> {formatNumber(calculation.totalAreaM2, 3)} м².
        </p>
      </div>
    </div>
  );
};
