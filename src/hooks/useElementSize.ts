import { useEffect, useRef, useState, type RefObject } from 'react';

type Size = { width: number; height: number };

export const useElementSize = <T extends HTMLElement>(
  enabled: boolean,
): { ref: RefObject<T | null>; size: Size } => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    if (!enabled) {
      setSize({ width: 0, height: 0 });
      return undefined;
    }

    const element = ref.current;
    if (!element) return undefined;

    const update = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.max(0, Math.round(rect.width)),
        height: Math.max(0, Math.round(rect.height)),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [enabled]);

  return { ref, size };
};
