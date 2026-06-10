import type { ModuleType } from '../domain/types';

export const getProfileMiddleFill = (type: ModuleType, idPrefix = 'profile'): string =>
  `url(#${idPrefix}-middle-${type})`;
