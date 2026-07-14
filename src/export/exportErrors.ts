export const describeUnknownError = (error: unknown): string => {
  if (error instanceof Error) return error.message;

  if (error instanceof Event) {
    const target = error.target;
    if (target instanceof HTMLImageElement && target.src) {
      return `ошибка загрузки изображения (${target.src})`;
    }
    if (target instanceof SVGImageElement) {
      const href = target.href?.baseVal;
      if (href) return `ошибка загрузки SVG-изображения (${href})`;
    }
    return error.type ? `ошибка браузера: ${error.type}` : 'ошибка браузера при формировании изображения';
  }

  if (typeof error === 'string') return error;
  return 'неизвестная ошибка';
};
