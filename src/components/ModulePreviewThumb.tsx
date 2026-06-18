import { profileTextureConfig } from '../data/profileTextures';
import { moduleDefinitions } from '../domain/moduleDefinitions';
import type { ModuleType } from '../domain/types';

type Props = {
  type: ModuleType;
};

export const ModulePreviewThumb = ({ type }: Props) => {
  const src = profileTextureConfig[type].paletteSrc ?? profileTextureConfig[type].moduleSrc;
  const label = moduleDefinitions[type].shortName;

  if (!src) {
    return <div className={`module-preview module-preview--fallback module-preview--${type}`} aria-hidden />;
  }

  return (
    <div className="module-preview">
      <img src={src} alt={label} className="module-preview__image" loading="lazy" draggable={false} />
    </div>
  );
};
