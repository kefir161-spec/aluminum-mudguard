import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type TransitionEvent,
} from 'react';

export type FullscreenPhase = 'idle' | 'entering' | 'fullscreen';

export type DomRect = { top: number; left: number; width: number; height: number };

export const ENTER_DURATION_MS = 280;
export const FLIP_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

export const readDomRect = (element: HTMLElement | null): DomRect | null => {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
};

export const computeFlipTransform = (from: DomRect, to: DomRect): string => {
  const scaleX = from.width / to.width;
  const scaleY = from.height / to.height;
  const translateX = from.left - to.left;
  const translateY = from.top - to.top;
  return `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`;
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Options = {
  containerRef: RefObject<HTMLElement | null>;
  toggleBtnRef: RefObject<HTMLButtonElement | null>;
  onBeforeLeave?: () => void;
};

export const useConstructorFullscreen = ({
  containerRef,
  toggleBtnRef,
  onBeforeLeave,
}: Options) => {
  const [phase, setPhase] = useState<FullscreenPhase>('idle');
  const sourceRectRef = useRef<DomRect | null>(null);
  const animatingRef = useRef(false);
  const reducedMotionRef = useRef(prefersReducedMotion());
  const onBeforeLeaveRef = useRef(onBeforeLeave);

  useEffect(() => {
    onBeforeLeaveRef.current = onBeforeLeave;
  }, [onBeforeLeave]);

  const isOverlayActive = phase !== 'idle';
  const isAnimating = phase === 'entering';
  const isFullscreen = isOverlayActive;

  const clearFlipStyles = useCallback((element: HTMLElement) => {
    element.style.transform = '';
    element.style.transformOrigin = '';
    element.style.transition = '';
  }, []);

  const finishEnter = useCallback(() => {
    setPhase((current) => {
      if (current !== 'entering') return current;
      const container = containerRef.current;
      if (container) clearFlipStyles(container);
      animatingRef.current = false;
      return 'fullscreen';
    });
  }, [clearFlipStyles, containerRef]);

  const exitToIdle = useCallback(() => {
    animatingRef.current = false;
    const container = containerRef.current;
    if (container) clearFlipStyles(container);
    sourceRectRef.current = null;
    setPhase('idle');
    requestAnimationFrame(() => toggleBtnRef.current?.focus({ preventScroll: true }));
  }, [clearFlipStyles, containerRef, toggleBtnRef]);

  const enterFullscreen = useCallback(() => {
    if (phase !== 'idle' || animatingRef.current) return;

    const container = containerRef.current;
    const sourceRect = readDomRect(container);
    sourceRectRef.current = sourceRect;

    if (reducedMotionRef.current || !sourceRect) {
      setPhase('fullscreen');
      return;
    }

    animatingRef.current = true;
    setPhase('entering');
  }, [containerRef, phase]);

  const leaveFullscreen = useCallback(() => {
    if (phase === 'idle') return;

    if (phase === 'entering') {
      exitToIdle();
      return;
    }

    if (animatingRef.current) return;
    if (phase !== 'fullscreen') return;

    onBeforeLeaveRef.current?.();
    exitToIdle();
  }, [exitToIdle, phase]);

  const toggleFullscreen = useCallback(() => {
    if (phase === 'idle') enterFullscreen();
    else leaveFullscreen();
  }, [enterFullscreen, leaveFullscreen, phase]);

  useLayoutEffect(() => {
    if (phase !== 'entering') return undefined;

    const container = containerRef.current;
    const sourceRect = sourceRectRef.current;
    if (!container || !sourceRect) {
      finishEnter();
      return undefined;
    }

    const targetRect = readDomRect(container);
    if (!targetRect) {
      finishEnter();
      return undefined;
    }

    const invert = computeFlipTransform(sourceRect, targetRect);
    container.style.transformOrigin = 'top left';
    container.style.transition = 'none';
    container.style.transform = invert;
    void container.offsetHeight;

    const raf = requestAnimationFrame(() => {
      container.style.transition = `transform ${ENTER_DURATION_MS}ms ${FLIP_EASING}`;
      container.style.transform = 'none';
    });

    const timeout = window.setTimeout(finishEnter, ENTER_DURATION_MS + 80);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [containerRef, finishEnter, phase]);

  const handleTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLElement>) => {
      if (event.propertyName !== 'transform') return;
      if (event.target !== containerRef.current) return;
      if (phase === 'entering') finishEnter();
    },
    [containerRef, finishEnter, phase],
  );

  useEffect(() => {
    if (!isOverlayActive) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') leaveFullscreen();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOverlayActive, leaveFullscreen]);

  return {
    phase,
    isFullscreen,
    isOverlayActive,
    isAnimating,
    toggleFullscreen,
    leaveFullscreen,
    handleTransitionEnd,
  };
};
