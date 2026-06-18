import { layoutPresets } from '../domain/presets';
import { PresetPatternMarkers } from './PresetPatternMarkers';
import { AccordionSection } from './ui/AccordionSection';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';

type Props = {
  onApply: (presetId: string) => void;
  embedded?: boolean;
};

export const PresetPanel = ({ onApply, embedded = false }: Props) => {
  const content = (
    <div className="preset-list">
      {layoutPresets.map((preset) => (
        <div key={preset.id} className="preset-card">
          <div className="preset-card__header">
            <strong className="preset-card__name">{preset.name}</strong>
            <PresetPatternMarkers pattern={preset.pattern} />
          </div>
          <p className="preset-card__desc">{preset.description}</p>
          <Button variant="secondary" size="sm" fullWidth onClick={() => onApply(preset.id)}>
            Применить
          </Button>
        </div>
      ))}
    </div>
  );

  const accordion = (
    <AccordionSection title="Готовые комбинации" defaultOpen={false}>
      {content}
    </AccordionSection>
  );

  if (embedded) {
    return <div className="preset-panel-embedded">{accordion}</div>;
  }

  return (
    <Panel>
      <AccordionSection title="Готовые комбинации" defaultOpen>
        {content}
      </AccordionSection>
    </Panel>
  );
};
