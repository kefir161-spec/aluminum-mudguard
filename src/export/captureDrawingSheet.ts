import { describeUnknownError } from './exportErrors';
import type { ExportImageOptions } from './exportPng';

const DRAWING_SHEET_STYLES = `
  svg, text { fill: #000; }
  .eskd-text, .eskd-title-text, .dim-label {
    font-family: 'GOST type B', 'GOST Common', 'ISOCPEUR', 'PT Sans Narrow', 'Arial Narrow', sans-serif;
    font-style: italic;
    fill: #000;
  }
  .dim-label { font-size: 18px; font-weight: 400; }
`;

const normalizeClipPathRefs = (root: ParentNode): void => {
  root.querySelectorAll<SVGElement>('[clip-path]').forEach((element) => {
    const value = element.getAttribute('clip-path');
    if (!value) return;

    const fragmentMatch = value.match(/#([A-Za-z0-9_-]+)/);
    if (fragmentMatch) {
      element.setAttribute('clip-path', `url(#${fragmentMatch[1]})`);
    }
  });
};

const prepareSvgClone = (svg: SVGSVGElement): SVGSVGElement => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = DRAWING_SHEET_STYLES;

  const defs =
    clone.querySelector('defs') ?? (() => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      clone.insertBefore(node, clone.firstChild);
      return node;
    })();

  defs.insertBefore(style, defs.firstChild);
  normalizeClipPathRefs(clone);
  return clone;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = src;
  });

/** Захват SVG-чертежа без html-to-image — стабильнее с clip-path и url(#). */
export const captureDrawingSheetPngDataUrl = async (
  node: HTMLElement,
  options: ExportImageOptions,
): Promise<string> => {
  const svg = node.querySelector('svg');
  if (!(svg instanceof SVGSVGElement)) {
    throw new Error('Не найден SVG-элемент чертежа для экспорта.');
  }

  const width = options.width ?? svg.width.baseVal.value;
  const height = options.height ?? svg.height.baseVal.value;
  const pixelRatio = options.pixelRatio ?? 2;

  if (width <= 0 || height <= 0) {
    throw new Error('Некорректный размер чертежа для экспорта.');
  }

  const clone = prepareSvgClone(svg);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  const svgMarkup = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(svgUrl);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas недоступен для экспорта.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/png');
  } catch (error) {
    throw new Error(`Не удалось сформировать изображение чертежа: ${describeUnknownError(error)}`, {
      cause: error,
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};
