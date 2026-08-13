import { mm } from '../domain/eskd';

/** Заголовок блока на чертеже. */
export const COMMENT_TITLE = 'Примечание';

/** Отступ блока от рамки и от основной надписи, мм. */
export const COMMENT_GAP_MM = 3;

const COMMENT_PAD_MM = 2.5;
const COMMENT_TITLE_GAP_MM = 1.6;
const COMMENT_MIN_H_MM = 14;
/** Ширина символа курсивного ГОСТ-шрифта относительно кегля. */
const CHAR_WIDTH_FACTOR = 0.58;
const LINE_HEIGHT_RATIO = 1.32;
/** Кегли от крупного (короткий текст) к читаемому минимуму для печати A3. */
const FONT_SIZES_PX = [16, 14, 12] as const;

export type CommentSlot = {
  x: number;
  width: number;
  bottom: number;
  maxHeight: number;
};

export type CommentBoxLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  titleFontSize: number;
  lineHeight: number;
  pad: number;
  titleGap: number;
  lines: string[];
  title: string;
};

const estimateCharWidth = (fontSize: number): number => fontSize * CHAR_WIDTH_FACTOR;

const maxCharsForWidth = (maxWidthPx: number, fontSize: number): number =>
  Math.max(1, Math.floor(maxWidthPx / estimateCharWidth(fontSize)));

/** Перенос по словам; слишком длинное слово режется по ширине поля, без выхода за край. */
export const wrapTextLines = (text: string, maxWidthPx: number, fontSize: number): string[] => {
  const maxChars = maxCharsForWidth(maxWidthPx, fontSize);
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let current = '';
    for (const word of words) {
      if (word.length > maxChars) {
        if (current) {
          lines.push(current);
          current = '';
        }
        for (let index = 0; index < word.length; index += maxChars) {
          lines.push(word.slice(index, index + maxChars));
        }
        continue;
      }

      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxChars) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
};

const withEllipsis = (line: string, maxChars: number): string => {
  if (maxChars <= 1) return '…';
  const trimmed = line.slice(0, maxChars - 1).trimEnd();
  return `${trimmed || line.slice(0, 1)}…`;
};

const fitLinesToHeight = (lines: string[], maxLines: number, maxChars: number): string[] => {
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = withEllipsis(visible[maxLines - 1], maxChars);
  return visible;
};

const measureBoxHeight = (lineCount: number, fontSize: number, pad: number, titleGap: number): number => {
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const titleH = fontSize * LINE_HEIGHT_RATIO;
  return pad + titleH + titleGap + lineCount * lineHeight + pad;
};

/**
 * Подбирает кегль и высоту блока под объём текста.
 * Блок стоит внизу слота (левый нижний угол листа), не выше основной надписи.
 */
export const layoutDrawingComment = (text: string, slot: CommentSlot): CommentBoxLayout | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const pad = mm(COMMENT_PAD_MM);
  const titleGap = mm(COMMENT_TITLE_GAP_MM);
  const minHeight = mm(COMMENT_MIN_H_MM);
  const contentWidth = Math.max(1, slot.width - pad * 2);

  let best: CommentBoxLayout | null = null;

  for (const fontSize of FONT_SIZES_PX) {
    const wrapped = wrapTextLines(trimmed, contentWidth, fontSize);
    if (wrapped.length === 0) return null;

    const lineHeight = fontSize * LINE_HEIGHT_RATIO;
    const maxLines = Math.max(
      1,
      Math.floor((slot.maxHeight - pad * 2 - lineHeight - titleGap) / lineHeight),
    );
    const maxChars = maxCharsForWidth(contentWidth, fontSize);
    const lines = fitLinesToHeight(wrapped, maxLines, maxChars);
    const contentHeight = measureBoxHeight(lines.length, fontSize, pad, titleGap);
    const height = Math.min(slot.maxHeight, Math.max(minHeight, contentHeight));
    const fits = contentHeight <= slot.maxHeight + 0.5;

    const candidate: CommentBoxLayout = {
      x: slot.x,
      y: slot.bottom - height,
      width: slot.width,
      height,
      fontSize,
      titleFontSize: fontSize,
      lineHeight,
      pad,
      titleGap,
      lines,
      title: COMMENT_TITLE,
    };

    best = candidate;
    if (fits) return candidate;
  }

  return best;
};
