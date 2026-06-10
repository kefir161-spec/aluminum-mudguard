import { useState } from 'react';
import { layoutPresets } from '../domain/presets';

type Props = {
  onApply: (presetId: string) => void;
  warning?: string;
};

export const PresetPanel = ({ onApply, warning }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Шаблоны раскладки</h2>
        <button className="toggle-btn" onClick={() => setIsExpanded((prev) => !prev)}>
          {isExpanded ? 'Свернуть' : 'Развернуть'}
        </button>
      </div>
      {isExpanded && (
        <div className="collapsible-content">
          <div className="preset-grid">
            {layoutPresets.map((preset) => (
              <button key={preset.id} className="preset-btn" onClick={() => onApply(preset.id)}>
                <strong>{preset.name}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>
          {warning && <p className="warning">{warning}</p>}
        </div>
      )}
    </section>
  );
};
