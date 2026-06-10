export const FIT_LINE_PAD_X = 10;
export const FIT_LINE_PAD_Y = 8;
export const FIT_LINE_BOX_H = 36;
const FIT_LINE_WIDTH_EXTRA = 6;

export const measureFitLineBadgeWidth = (textEl: SVGTextElement): number =>
  Math.ceil(textEl.getBBox().width) + FIT_LINE_PAD_X * 2 + FIT_LINE_WIDTH_EXTRA;

/** Подгоняет ширину рамки под фактическую ширину текста (для экрана и экспорта). */
export const syncFitLineBadges = (root: ParentNode): void => {
  root.querySelectorAll<SVGGElement>('.sheet-spec-fit').forEach((group) => {
    const text = group.querySelector<SVGTextElement>('.sheet-spec-fit-line');
    const rect = group.querySelector<SVGRectElement>('rect');
    if (!text || !rect) return;
    rect.setAttribute('width', String(measureFitLineBadgeWidth(text)));
  });
};
