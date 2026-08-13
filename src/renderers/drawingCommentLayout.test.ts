import { describe, expect, it } from 'vitest';
import { clampDrawingComment, MAX_DRAWING_COMMENT_LENGTH } from '../domain/drawingComment';
import { mm, TITLE_BLOCK_MM } from '../domain/eskd';
import { computeSheetLayout } from './drawingLayout';
import { COMMENT_GAP_MM, layoutDrawingComment, wrapTextLines } from './drawingCommentLayout';

const slot = {
  x: 69,
  width: 400,
  bottom: 876,
  maxHeight: mm(TITLE_BLOCK_MM.height),
};

describe('drawingComment', () => {
  it('clamps comment length', () => {
    const long = 'а'.repeat(MAX_DRAWING_COMMENT_LENGTH + 40);
    expect(clampDrawingComment(long)).toHaveLength(MAX_DRAWING_COMMENT_LENGTH);
  });

  it('returns null for empty comment', () => {
    expect(layoutDrawingComment('   ', slot)).toBeNull();
  });

  it('uses larger type for a short note and sits on the bottom edge', () => {
    const box = layoutDrawingComment('Уложить ворс к входу', slot);
    expect(box).not.toBeNull();
    if (!box) return;
    expect(box.fontSize).toBe(16);
    expect(box.y + box.height).toBeCloseTo(slot.bottom, 5);
    expect(box.height).toBeLessThanOrEqual(slot.maxHeight);
    expect(box.width).toBe(slot.width);
  });

  it('grows with more text but stays inside the title-block band', () => {
    const short = layoutDrawingComment('Кратко', slot);
    const long = layoutDrawingComment(
      'Согласовать цвет с заказчиком. Укладка ворса к входу. Крайние планки — резина. Не сверлить отверстие ближе 30 мм от края профиля.',
      slot,
    );
    expect(short && long).toBeTruthy();
    if (!short || !long) return;
    expect(long.height).toBeGreaterThanOrEqual(short.height);
    expect(long.y).toBeGreaterThanOrEqual(slot.bottom - slot.maxHeight);
    expect(long.y + long.height).toBeCloseTo(slot.bottom, 5);
  });

  it('wraps words without overflowing the field width', () => {
    const fontSize = 16;
    const maxWidth = 180;
    const lines = wrapTextLines('короткое слово и ещё одно для переноса строки', maxWidth, fontSize);
    const maxChars = Math.floor(maxWidth / (fontSize * 0.58));
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(maxChars);
    }
  });

  it('splits an oversized word instead of overflowing', () => {
    const fontSize = 14;
    const maxWidth = 90;
    const lines = wrapTextLines('А'.repeat(80), maxWidth, fontSize);
    const maxChars = Math.floor(maxWidth / (fontSize * 0.58));
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(maxChars);
    }
  });

  it('reserves a slot left of the title block without overlap', () => {
    const layout = computeSheetLayout({ hasCableAnnotation: false });
    expect(layout.commentX + layout.commentMaxW).toBeLessThan(layout.titleBlockX);
    expect(layout.commentMaxH).toBe(mm(TITLE_BLOCK_MM.height) - mm(COMMENT_GAP_MM));
    expect(layout.commentBottom).toBeGreaterThan(layout.titleBlockY);
    expect(layout.commentBottom).toBeLessThan(layout.titleBlockY + mm(TITLE_BLOCK_MM.height));
  });
});
