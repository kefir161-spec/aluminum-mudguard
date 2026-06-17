import type { CalculationResult, ProductConfig } from '../domain/types';

type Props = {
  config: ProductConfig;
  calculation: CalculationResult;
};

export const SpecPanel = ({ config, calculation }: Props) => (
  <div className="spec-wrap">
    <h2>Спецификация</h2>
    <table className="table">
      <thead>
        <tr>
          <th>№</th>
          <th>Тип профиля</th>
          <th>Количество полос</th>
          <th>Суммарная длина, мм</th>
          <th>Ширина, мм</th>
          <th>Площадь, м²</th>
          <th>Цена за м²</th>
          <th>Стоимость</th>
          <th>Комментарий</th>
        </tr>
      </thead>
      <tbody>
        {calculation.byType.map((row, index) => (
          <tr key={row.type}>
            <td>{index + 1}</td>
            <td>{row.type}</td>
            <td>{row.count}</td>
            <td>{row.totalWidthMm.toFixed(1)}</td>
            <td>{config.totalLengthMm.toFixed(1)}</td>
            <td>{row.areaM2.toFixed(3)}</td>
            <td>{Math.round(row.unitPrice).toLocaleString('ru-RU')}</td>
            <td>{Math.round(row.price).toLocaleString('ru-RU')} ₽</td>
            <td>Ориентировочный расчет</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p>
      Заглушки: <strong>{calculation.plugCount} шт.</strong> (2 на каждую планку, кроме скребка). Втулки:{' '}
      <strong>{calculation.bushingCount} шт.</strong> ((профилей − 1) × тросы).
    </p>
    <p>
      Тросы:{' '}
      <strong>{calculation.cableLayout ? `${calculation.cableLayout.count} шт.` : 'не размещены'}</strong>
      {calculation.cableLayout?.spacingsMm.length
        ? `, шаг ${calculation.cableLayout.spacingsMm.join(', ')} мм`
        : ''}
    </p>
    <p>
      Итоговая площадь: <strong>{calculation.totalAreaM2.toFixed(3)} м²</strong>, итоговая стоимость:{' '}
      <strong>{Math.round(calculation.totalPrice).toLocaleString('ru-RU')} ₽</strong>.
    </p>
    <p className="warning">Расчет ориентировочный и требует уточнения.</p>
  </div>
);
