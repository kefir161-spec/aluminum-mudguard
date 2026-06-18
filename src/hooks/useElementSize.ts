import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

type Size = { width: number; height: number };

const EMPTY_SIZE: Size = { width: 0, height: 0 };

const readSize = (element: HTMLElement): Size => {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(0, Math.round(rect.width)),
    height: Math.max(0, Math.round(rect.height)),
  };
};

export const useElementSize = <T extends HTMLElement>(
  enabled: boolean,
  resetKey?: unknown,
): { ref: RefObject<T | null>; size: Size } => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>(EMPTY_SIZE);

  useLayoutEffect(() => {
    if (!enabled) return undefined;

    const element = ref.current;
    if (!element) return undefined;

    const update = () => {
      setSize(readSize(element));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [enabled, resetKey]);

  return { ref, size: enabled ? size : EMPTY_SIZE };
};
