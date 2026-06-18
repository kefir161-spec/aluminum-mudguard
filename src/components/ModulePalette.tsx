import { Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { moduleDefinitions, moduleTypeOrder } from '../domain/moduleDefinitions';
import type { ModuleType } from '../domain/types';
import { ModulePreviewThumb } from './ModulePreviewThumb';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { SectionHeader } from './ui/SectionHeader';
import { useToast } from './ui/useToast';

type Props = {
  onAdd: (type: ModuleType) => void;
  warning?: string;
  presets?: ReactNode;
};

export const ModulePalette = ({ onAdd, warning, presets }: Props) => {
  const { showToast } = useToast();
  const [addedType, setAddedType] = useState<ModuleType | null>(null);

  const handleAdd = (type: ModuleType) => {
    onAdd(type);
    setAddedType(type);
    showToast(`${moduleDefinitions[type].shortName} добавлена`, 'success');
    window.setTimeout(() => setAddedType(null), 600);
  };

  return (
    <Panel className="module-palette">
      <SectionHeader title="Профили" subtitle="Добавляйте планки в полотно" />
      {warning && <p className="inline-warning">{warning}</p>}
      <div className="module-list">
        {moduleTypeOrder.map((type) => (
          <article key={type} className={`module-card${addedType === type ? ' module-card--added' : ''}`}>
            <ModulePreviewThumb type={type} />
            <div className="module-card__body">
              <h3 className="module-card__title">{moduleDefinitions[type].shortName}</h3>
              <p className="module-card__desc">{moduleDefinitions[type].description}</p>
              <div className="module-card__actions">
                <Button variant="primary" size="sm" fullWidth onClick={() => handleAdd(type)}>
                  <Plus size={14} aria-hidden />
                  Добавить
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {presets && <div className="module-palette__presets">{presets}</div>}
    </Panel>
  );
};
