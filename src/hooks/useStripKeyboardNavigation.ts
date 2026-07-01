import { useEffect } from 'react';
import type { Strip } from '../domain/types';

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
};

const isModalOpen = (): boolean => document.querySelector('[aria-modal="true"]') !== null;

export const resolveAdjacentStripId = (
  strips: Strip[],
  selectedStripId: string | undefined,
  direction: 'up' | 'down',
): string | undefined => {
  if (strips.length === 0) return undefined;

  const currentIndex = selectedStripId
    ? strips.findIndex((strip) => strip.id === selectedStripId)
    : -1;

  if (currentIndex < 0) {
    return direction === 'down' ? strips[0]?.id : strips[strips.length - 1]?.id;
  }

  const nextIndex =
    direction === 'up'
      ? Math.max(0, currentIndex - 1)
      : Math.min(strips.length - 1, currentIndex + 1);

  return strips[nextIndex]?.id;
};

type Options = {
  strips: Strip[];
  selectedStripId?: string;
  onSelect: (stripId: string) => void;
  enabled?: boolean;
};

export const useStripKeyboardNavigation = ({
  strips,
  selectedStripId,
  onSelect,
  enabled = true,
}: Options) => {
  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (isTypingTarget(event.target)) return;
      if (isModalOpen()) return;

      const direction = event.key === 'ArrowUp' ? 'up' : 'down';
      const nextId = resolveAdjacentStripId(strips, selectedStripId, direction);
      if (!nextId || nextId === selectedStripId) return;

      event.preventDefault();
      onSelect(nextId);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, onSelect, selectedStripId, strips]);
};
