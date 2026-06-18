import { moduleDefinitions, moduleTypeOrder } from '../domain/moduleDefinitions';
import type { ModuleType } from '../domain/types';
import { ModulePreviewThumb } from './ModulePreviewThumb';

type Props = {
  onAdd: (type: ModuleType) => void;
  onAddMany: (type: ModuleType, count: number) => void;
  warning?: string;
};

export const ModulePalette = ({ onAdd, onAddMany, warning }: Props) => (
    <section className="panel">
      <h2>Базовые профили</h2>
      {warning && <p className="warning">{warning}</p>}
    {moduleTypeOrder.map((type) => (
      <article key={type} className="module-card">
        <ModulePreviewThumb type={type} />
        <div>
          <h3>{moduleDefinitions[type].shortName}</h3>
          <p>{moduleDefinitions[type].description}</p>
          <div className="row row-actions">
            <button type="button" onClick={() => onAdd(type)}>
              Добавить
            </button>
            <button type="button" onClick={() => onAddMany(type, 3)}>
              +3
            </button>
          </div>
        </div>
      </article>
    ))}
  </section>
);
