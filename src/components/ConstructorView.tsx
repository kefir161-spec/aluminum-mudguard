import { Maximize2, Minimize2 } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ProductConfig } from '../domain/types';
import { useConstructorFullscreen } from '../hooks/useConstructorFullscreen';
import { useElementSize } from '../hooks/useElementSize';
import { TopViewRenderer } from '../renderers/TopViewRenderer';
import { IconButton } from './ui/IconButton';

type Viewport = { width: number; height: number };

type Props = {
  config: ProductConfig;
  selectedStripId?: string;
  onStripClick: (stripId: string) => void;
  onStripRemove: (stripId: string) => void;
};

export const ConstructorView = ({ config, selectedStripId, onStripClick, onStripRemove }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const pendingExitViewportRef = useRef<Viewport | undefined>(undefined);

  const [renderProfile, setRenderProfile] = useState<{ isFullscreen: boolean; viewport?: Viewport }>({
    isFullscreen: false,
  });

  const prepareExitViewport = useCallback(() => {
    pendingExitViewportRef.current = readViewport(placeholderRef.current);
  }, []);

  const {
    phase,
    isFullscreen,
    isOverlayActive,
    isAnimating,
    toggleFullscreen,
    handleTransitionEnd,
  } = useConstructorFullscreen({
    containerRef,
    toggleBtnRef,
    onBeforeLeave: prepareExitViewport,
  });

  const { ref: canvasRef, size: canvasSize } = useElementSize<HTMLDivElement>(true, isFullscreen);

  useLayoutEffect(() => {
    if (phase === 'entering') return;

    if (phase === 'idle' && pendingExitViewportRef.current) {
      const target = pendingExitViewportRef.current;
      pendingExitViewportRef.current = undefined;
      setRenderProfile({ isFullscreen: false, viewport: target });
      return;
    }

    const element = canvasRef.current;
    if (!element) return;

    const nextViewport = readViewport(element);
    if (!nextViewport) return;

    const nextIsFullscreen = phase !== 'idle';

    setRenderProfile((current) => {
      if (
        current.isFullscreen === nextIsFullscreen &&
        current.viewport?.width === nextViewport.width &&
        current.viewport?.height === nextViewport.height
      ) {
        return current;
      }
      return { isFullscreen: nextIsFullscreen, viewport: nextViewport };
    });
  }, [phase, canvasSize.width, canvasSize.height, canvasRef]);

  const containerClassName = [
    'constructor-view',
    isOverlayActive && 'constructor-view--overlay',
    phase === 'fullscreen' && 'constructor-view--fullscreen',
    isAnimating && 'constructor-view--animating',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="constructor-view-root">
      {isOverlayActive && (
        <div ref={placeholderRef} className="constructor-view-placeholder" aria-hidden="true" />
      )}

      {isOverlayActive && (
        <div className="constructor-fullscreen-backdrop constructor-fullscreen-backdrop--visible" aria-hidden="true" />
      )}

      <div
        ref={containerRef}
        className={containerClassName}
        onTransitionEnd={handleTransitionEnd}
      >
        <div ref={canvasRef} className="constructor-canvas">
          <TopViewRenderer
            config={config}
            selectedStripId={selectedStripId}
            onStripClick={onStripClick}
            onStripRemove={onStripRemove}
            isFullscreen={renderProfile.isFullscreen}
            viewport={renderProfile.viewport}
          />
        </div>

        <div className={`constructor-toolbar${isOverlayActive ? ' constructor-toolbar--floating' : ''}`}>
          <IconButton
            ref={toggleBtnRef}
            label={isFullscreen ? 'Свернуть' : 'На весь экран'}
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            disabled={isAnimating}
            className="constructor-fullscreen-btn"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
          {isOverlayActive && (
            <span className="constructor-esc-hint" aria-hidden="true">
              Esc
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const readViewport = (element: HTMLElement | null | undefined): Viewport | undefined => {
  if (!element) return undefined;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return undefined;
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
};
