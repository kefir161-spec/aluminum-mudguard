/** Форматирование допуска натяжения для сообщений пользователю. */
export const formatAllowance = (minMm: number, maxMm: number): string =>
  Math.abs(minMm - maxMm) < 0.05
    ? `±${Math.round(minMm)} мм`
    : `±${Math.round(minMm)}–${Math.round(maxMm)} мм`;
