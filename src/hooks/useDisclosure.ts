import { useCallback, useEffect, useState } from 'react';

export type DisclosureState = 'closed' | 'opening' | 'open' | 'closing';

export const DISCLOSURE_DURATIONS = {
  dropdown: { open: 160, close: 120 },
  drawer: { open: 220, close: 140 },
  sheet: { open: 240, close: 140 },
} as const;

type DurationKey = keyof typeof DISCLOSURE_DURATIONS;

type DisclosureOptions = {
  defaultOpen?: boolean;
  duration?: DurationKey | { open: number; close: number };
};

const resolveDurations = (duration: DisclosureOptions['duration']) => {
  if (!duration) return DISCLOSURE_DURATIONS.dropdown;
  if (typeof duration === 'string') return DISCLOSURE_DURATIONS[duration];
  return duration;
};

const isVisible = (state: DisclosureState) => state !== 'closed';

export const toSurfaceState = (state: DisclosureState): 'closed' | 'open' | 'closing' => {
  if (state === 'closing') return 'closing';
  if (state === 'closed') return 'closed';
  return 'open';
};

export const useDisclosure = (options: DisclosureOptions = {}) => {
  const { open: openMs, close: closeMs } = resolveDurations(options.duration);
  const [state, setState] = useState<DisclosureState>(options.defaultOpen ? 'open' : 'closed');

  useEffect(() => {
    if (state === 'opening') {
      const id = window.setTimeout(() => setState('open'), openMs);
      return () => window.clearTimeout(id);
    }
    if (state === 'closing') {
      const id = window.setTimeout(() => setState('closed'), closeMs);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [state, openMs, closeMs]);

  const open = useCallback(() => {
    setState((current) => {
      if (current === 'open' || current === 'opening') return current;
      return 'opening';
    });
  }, []);

  const close = useCallback(() => {
    setState((current) => {
      if (current === 'closed' || current === 'closing') return current;
      return 'closing';
    });
  }, []);

  const toggle = useCallback(() => {
    setState((current) => {
      if (current === 'closed') return 'opening';
      if (current === 'open' || current === 'opening') return 'closing';
      return current;
    });
  }, []);

  return {
    state,
    isMounted: isVisible(state),
    isOpen: state === 'open' || state === 'opening',
    surfaceState: toSurfaceState(state),
    open,
    close,
    toggle,
  };
};

export const useControlledDisclosure = (open: boolean, duration: DurationKey | { open: number; close: number } = 'drawer') => {
  const { open: openMs, close: closeMs } = resolveDurations(duration);
  const [state, setState] = useState<DisclosureState>(open ? 'open' : 'closed');
  const [prevOpen, setPrevOpen] = useState(open);

  // Синхронизация с управляющим prop во время рендера (рекомендованный React-паттерн без эффекта).
  if (open !== prevOpen) {
    setPrevOpen(open);
    setState((current) => {
      if (open) return 'opening';
      return current === 'closed' ? 'closed' : 'closing';
    });
  }

  useEffect(() => {
    if (state === 'opening') {
      const id = window.setTimeout(() => setState('open'), openMs);
      return () => window.clearTimeout(id);
    }
    if (state === 'closing') {
      const id = window.setTimeout(() => setState('closed'), closeMs);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [state, openMs, closeMs]);

  return {
    state,
    isMounted: isVisible(state),
    isInteractive: state === 'open' || state === 'opening',
    surfaceState: toSurfaceState(state),
  };
};
