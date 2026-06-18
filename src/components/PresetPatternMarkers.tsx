import type { ModuleType } from '../domain/types';

const typeClass: Record<ModuleType, string> = {
  rubber: 'preset-marker--rubber',
  pile: 'preset-marker--pile',
  brush: 'preset-marker--brush',
  scraper: 'preset-marker--scraper',
};

type Props = {
  pattern: ModuleType[];
};

export const PresetPatternMarkers = ({ pattern }: Props) => (
  <div className="preset-markers" aria-hidden>
    {pattern.map((type, index) => (
      <span key={`${type}-${index}`} className={`preset-marker ${typeClass[type]}`} title={type} />
    ))}
  </div>
);
