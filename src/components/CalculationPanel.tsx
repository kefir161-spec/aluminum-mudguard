import { useState } from 'react';
import { moduleDefinitions } from '../domain/moduleDefinitions';
import type { CalculationResult } from '../domain/types';
import { formatMoney, formatNumber } from '../domain/calculations';

type Props = {
  calculation: CalculationResult;
  warnings: string[];
};

export const CalculationPanel = ({ calculation, warnings }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Расчет</h2>
        <button type="button" className="toggle-btn" onClick={() => setIsExpanded((prev) => !prev)}>
          {isExpanded ? 'Свернуть' : 'Развернуть'}
        </button>
      </div>
      {isExpanded && (
        <div className="collapsible-content">
          <p className="muted">Ориентировочный расчет для демо</p>
          <ul className="calc-list">
            {Math.abs(calculation.remainderMm) > 0 && (
              <li className={calculation.isUnderfilled ? 'calc-gap-warning' : 'calc-gap-error'}>
                {calculation.isUnderfilled
                  ? `Остаток: ${calculation.remainderMm} мм`
                  : `Переполнение: ${Math.abs(calculation.remainderMm)} мм`}
              </li>
            )}
            <li>Площадь: {formatNumber(calculation.totalAreaM2, 3)} м²</li>
            <li>Полос: {calculation.byType.reduce((sum, item) => sum + item.count, 0)}</li>
            <li>Заглушки: {calculation.plugCount} шт.</li>
            <li>Втулки: {calculation.bushingCount} шт.</li>
            <li>
              Тросы: {calculation.cableLayout ? `${calculation.cableLayout.count} шт.` : 'не размещены'}
              {calculation.cableLayout && calculation.cableLayout.spacingsMm.length > 0
                ? `, шаг ${calculation.cableLayout.spacingsMm.join(', ')} мм`
                : ''}
            </li>
            <li>Итоговая стоимость: {formatMoney(calculation.totalPrice)} ₽</li>
          </ul>
          <div className="table-scroll">
            <table className="table compact">
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Кол-во</th>
                  <th>Площадь</th>
                  <th>Стоимость</th>
                </tr>
              </thead>
              <tbody>
                {calculation.byType.map((row) => (
                  <tr key={row.type}>
                    <td>{moduleDefinitions[row.type].shortName}</td>
                    <td>{row.count}</td>
                    <td>{formatNumber(row.areaM2, 3)}</td>
                    <td>{formatMoney(row.price)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {warnings.length > 0 && (
            <div className="warning-list">
              {warnings.map((warning) => (
                <p key={warning} className="warning">
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
