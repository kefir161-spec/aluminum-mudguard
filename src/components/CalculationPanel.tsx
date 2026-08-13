import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { moduleDefinitions } from '../domain/moduleDefinitions';
import type { CalculationResult } from '../domain/types';
import { formatMoney, formatNumber } from '../domain/calculations';
import { formatCarpetCountSuffix } from '../domain/carpetCount';
import { Button } from './ui/Button';
import { MetricCard } from './ui/MetricCard';
import { Panel } from './ui/Panel';
import { StatusBadge } from './ui/StatusBadge';

type Props = {
  calculation: CalculationResult;
  warnings: string[];
  compact?: boolean;
  onExpandDetails?: () => void;
  showStatusBadge?: boolean;
  footerNote?: string;
};

const getFillStatus = (calculation: CalculationResult): { tone: 'success' | 'warning' | 'error'; label: string } => {
  if (calculation.isOverfilled) {
    return { tone: 'error', label: `Переполнение ${Math.abs(calculation.remainderMm)} мм` };
  }
  if (calculation.isUnderfilled) {
    return { tone: 'warning', label: `Остаток ${calculation.remainderMm} мм` };
  }
  if (calculation.fitApplied && calculation.isFullyFitted) {
    return { tone: 'success', label: 'Подогнано под заказ' };
  }
  return { tone: 'success', label: 'Заполнено корректно' };
};

const primaryWarning = (warnings: string[]): string | undefined => warnings[0];

const CalcFooterNote = ({ text }: { text: string }) => (
  <p className="calc-panel__footer-note" role="status">
    <AlertTriangle size={16} aria-hidden />
    <strong>{text}</strong>
  </p>
);

export const CalculationSummary = ({
  calculation,
  compact = false,
  onExpandDetails,
  showStatusBadge = true,
  footerNote,
}: Omit<Props, 'warnings'>) => {
  const status = getFillStatus(calculation);
  const stripCount = calculation.byType.reduce((sum, item) => sum + item.count, 0);
  const forCarpets = formatCarpetCountSuffix(calculation.carpetCount);

  return (
    <div className="calc-summary">
      <div className="calc-summary__metrics">
        {showStatusBadge && (
          <div className="calc-summary__status">
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
        )}
        {forCarpets && <MetricCard label="Ковров" value={String(calculation.carpetCount)} />}
        <MetricCard
          label={forCarpets ? `Площадь ${forCarpets}` : 'Площадь'}
          value={`${formatNumber(calculation.totalAreaM2, 3)} м²`}
        />
        <MetricCard label="Полос" value={String(stripCount)} />
        <MetricCard
          label={forCarpets ? `Стоимость, стандарт ${forCarpets}` : 'Стоимость, стандарт'}
          value={`${formatMoney(calculation.totalPrice.standard)} ₽`}
        />
        <MetricCard
          label={forCarpets ? `Стоимость, усиленная ${forCarpets}` : 'Стоимость, усиленная'}
          value={`${formatMoney(calculation.totalPrice.reinforced)} ₽`}
        />
      </div>
      {compact && onExpandDetails && (
        <Button variant="ghost" size="sm" onClick={onExpandDetails} className="calc-summary__expand">
          Подробнее
          <ChevronUp size={14} aria-hidden />
        </Button>
      )}
      {footerNote && <CalcFooterNote text={footerNote} />}
    </div>
  );
};

export const CalculationPanel = ({ calculation, warnings }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rows = calculation.byType.filter((row) => row.count > 0);
  const footerWarning = useMemo(() => primaryWarning(warnings), [warnings]);
  const extraWarnings = useMemo(() => (warnings.length > 1 ? warnings.slice(1) : []), [warnings]);

  return (
    <Panel className="calc-panel">
      <CalculationSummary calculation={calculation} showStatusBadge={!footerWarning} />
      <Button
        variant="ghost"
        size="sm"
        fullWidth
        onClick={() => setIsExpanded((prev) => !prev)}
        className="calc-panel__toggle"
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Свернуть детали' : 'Развернуть расчёт'}
        {isExpanded ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
      </Button>
      {isExpanded && (
        <div className="calc-panel__details">
          <ul className="calc-detail-list">
            {calculation.carpetCount > 1 && <li>Количество ковров: {calculation.carpetCount} шт.</li>}
            <li>Заглушки: {calculation.plugCount} шт.</li>
            <li>Втулки: {calculation.bushingCount} шт.</li>
            <li>
              Тросы:{' '}
              {calculation.cableLayout
                ? `${calculation.cableLayout.count * calculation.carpetCount} шт.`
                : 'не размещены'}
              {calculation.cableLayout && calculation.cableLayout.spacingsMm.length > 0
                ? `, шаг ${calculation.cableLayout.spacingsMm.join(', ')} мм`
                : ''}
            </li>
            {calculation.narrowWidthDiscountApplied && (
              <>
                <li>
                  Стоимость без скидки: {formatMoney(calculation.subtotalPrice.standard)} ₽ /{' '}
                  {formatMoney(calculation.subtotalPrice.reinforced)} ₽
                </li>
                <li className="calc-discount">
                  Скидка за узкую ширину (&lt; 1200 мм): −{formatMoney(calculation.narrowWidthDiscountAmount.standard)}{' '}
                  ₽ / −{formatMoney(calculation.narrowWidthDiscountAmount.reinforced)} ₽ (
                  {calculation.narrowWidthDiscountPercent}%)
                </li>
              </>
            )}
          </ul>
          <div className="spec-table-wrap">
            <table className="data-table data-table--compact">
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Кол-во</th>
                  <th>Площадь</th>
                  <th>Стандарт</th>
                  <th>Усиленная</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.type}>
                    <td>{moduleDefinitions[row.type].shortName}</td>
                    <td>{row.count}</td>
                    <td>{formatNumber(row.areaM2, 3)}</td>
                    <td>{formatMoney(row.price.standard)} ₽</td>
                    <td>{formatMoney(row.price.reinforced)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {extraWarnings.length > 0 && (
            <div className="calc-panel__extra-warnings">
              {extraWarnings.map((warning) => (
                <p key={warning} className="calc-panel__hint">
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {footerWarning && <CalcFooterNote text={footerWarning} />}
    </Panel>
  );
};
