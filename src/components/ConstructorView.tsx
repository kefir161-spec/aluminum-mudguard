import { useEffect, useState } from 'react';
import type { ProductConfig } from '../domain/types';
import { useElementSize } from '../hooks/useElementSize';
import { TopViewRenderer } from '../renderers/TopViewRenderer';

type Props = {
  config: ProductConfig;
  selectedStripId?: string;
  onStripClick: (stripId: string) => void;
  onStripRemove: (stripId: string) => void;
};

export const ConstructorView = ({ config, selectedStripId, onStripClick, onStripRemove }: Props) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { ref: canvasRef, size: canvasSize } = useElementSize<HTMLDivElement>(true);

  useEffect(() => {
    if (!isFullscreen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  return (
    <div className={`constructor-view${isFullscreen ? ' constructor-view--fullscreen' : ''}`}>
      <div ref={canvasRef} className="constructor-canvas">
        <TopViewRenderer
          config={config}
          selectedStripId={selectedStripId}
          onStripClick={onStripClick}
          onStripRemove={onStripRemove}
          isFullscreen={isFullscreen}
          viewport={canvasSize.width > 0 && canvasSize.height > 0 ? canvasSize : undefined}
        />
      </div>
      <div className="constructor-toolbar">
        <button
          type="button"
          className="constructor-fullscreen-btn"
          onClick={toggleFullscreen}
          aria-pressed={isFullscreen}
        >
          {isFullscreen ? 'Свернуть' : 'На весь экран'}
        </button>
      </div>
    </div>
  );
};
