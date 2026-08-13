/** Лимит текста комментария на чертеже. */
export const MAX_DRAWING_COMMENT_LENGTH = 400;

export const clampDrawingComment = (value: string): string =>
  value.replace(/\r\n/g, '\n').slice(0, MAX_DRAWING_COMMENT_LENGTH);
