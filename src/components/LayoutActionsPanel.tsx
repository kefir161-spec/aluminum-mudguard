import { Trash2 } from 'lucide-react';
import { derivePatternFromStrips, getDisplayLayoutPattern } from '../domain/layoutRules';
import { moduleDefinitions } from '../domain/moduleDefinitions';
import type { ProductConfig } from '../domain/types';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { SectionHeader } from './ui/SectionHeader';

type Props = {
  config: ProductConfig;
  onAutoFill: () => void;
  onRequestClearAll: () => void;
};

export const LayoutActionsPanel = ({ config, onAutoFill, onRequestClearAll }: Props) => {
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
  const canAutoFill = seedPattern.length > 0;

  return (
    <Panel className="layout-actions-panel">
      <SectionHeader title="Заполнение полотна" />
      {layoutPatternLabel ? (
        <p className="field-hint layout-actions-panel__combo">
          <strong>Комбинация:</strong> {layoutPatternLabel}
        </p>
      ) : (
        <p className="field-hint layout-actions-panel__combo">Добавьте планки, чтобы сформировать комбинацию.</p>
      )}
      <div className="layout-actions-panel__buttons">
        <Button variant="success" size="lg" fullWidth onClick={onAutoFill} disabled={!canAutoFill}>
          Автозаполнить остаток
        </Button>
        {!canAutoFill && (
          <p className="field-hint field-hint--warning">
            Добавьте хотя бы одну планку, чтобы использовать автозаполнение.
          </p>
        )}
        <Button
          variant="danger"
          size="sm"
          fullWidth
          onClick={onRequestClearAll}
          disabled={config.strips.length === 0}
        >
          <Trash2 size={14} aria-hidden />
          Очистить всё
        </Button>
      </div>
    </Panel>
  );
};
