import type { ProductConfig } from './types';

/**
 * Константы и помощники для оформления чертежа по ЕСКД.
 * - ГОСТ 2.301 — форматы и рамка;
 * - ГОСТ 2.302 — масштабы;
 * - ГОСТ 2.303 — линии;
 * - ГОСТ 2.104 — основная надпись.
 */

/** Масштаб отрисовки листа: пикселей на миллиметр листа. */
export const SHEET_PX_PER_MM = 3;

/** Формат A3 (горизонтальный) по ГОСТ 2.301. */
export const SHEET_A3 = {
  widthMm: 420,
  heightMm: 297,
} as const;

export const SHEET_WIDTH_PX = SHEET_A3.widthMm * SHEET_PX_PER_MM;
export const SHEET_HEIGHT_PX = SHEET_A3.heightMm * SHEET_PX_PER_MM;

/** Поля рамки по ГОСТ 2.301: 20 мм слева (под подшивку), по 5 мм с остальных сторон. */
export const FRAME_MARGINS_MM = {
  left: 20,
  top: 5,
  right: 5,
  bottom: 5,
} as const;

/** Толщины линий по ГОСТ 2.303 (в мм), приведённые к px листа. */
const LINE_MM = {
  thick: 0.7, // сплошная основная (s)
  thin: 0.3, // сплошная тонкая (s/2…s/3)
} as const;

export const LINE_THICK_PX = LINE_MM.thick * SHEET_PX_PER_MM;
export const LINE_THIN_PX = LINE_MM.thin * SHEET_PX_PER_MM;

/** Габариты основной надписи (форма 1) по ГОСТ 2.104, мм. */
export const TITLE_BLOCK_MM = {
  width: 185,
  height: 55,
} as const;

/** Наименование организации-изготовителя (графа 9 основной надписи). */
export const ESKD_ORG_NAME = 'Алюминиевые решётки';

/** mm → px листа. */
export const mm = (value: number): number => value * SHEET_PX_PER_MM;

/**
 * Стандартный ряд масштабов уменьшения по ГОСТ 2.302 (как доли «изображение/натура»).
 * Также допускаются масштаб 1:1 и масштабы увеличения.
 */
const REDUCTION_SCALES: number[] = [
  1, 1 / 2, 1 / 2.5, 1 / 4, 1 / 5, 1 / 10, 1 / 15, 1 / 20, 1 / 25, 1 / 40, 1 / 50, 1 / 75, 1 / 100,
  1 / 200, 1 / 400, 1 / 500, 1 / 800, 1 / 1000,
];

const ENLARGE_SCALES: number[] = [2, 2.5, 4, 5, 10];

/**
 * Подбор ближайшего стандартного масштаба, не превышающего естественный коэффициент.
 * @param naturalRatio коэффициент «изображение/натура» при вписывании в область.
 */
export const snapStandardScale = (naturalRatio: number): number => {
  if (naturalRatio >= 1) {
    let best = 1;
    for (const ratio of ENLARGE_SCALES) {
      if (ratio <= naturalRatio) best = ratio;
    }
    return best;
  }
  let best = REDUCTION_SCALES[REDUCTION_SCALES.length - 1];
  for (const ratio of REDUCTION_SCALES) {
    if (ratio <= naturalRatio + 1e-9) {
      best = ratio;
      break;
    }
  }
  return best;
};

/** Форматирование масштаба для основной надписи: «1:10», «2:1». */
export const formatScaleLabel = (ratio: number): string => {
  if (ratio >= 1) {
    const value = Number(ratio.toFixed(2));
    return `${value}:1`;
  }
  const denominator = Number((1 / ratio).toFixed(2));
  return `1:${denominator}`;
};

const hashCode = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

/** Обозначение документа (графа 2) по шаблону предприятия: АМ-XXXX СБ. */
export const deriveDesignation = (config: ProductConfig): string => {
  const code = String(hashCode(config.id) % 10000).padStart(4, '0');
  return `АМ-${code} СБ`;
};

/** Наименование изделия (графа 1): из имени проекта или значение по умолчанию. */
export const deriveProductName = (config: ProductConfig): string => {
  const name = config.projectName.trim();
  if (!name || name.toLowerCase() === 'новый проект') {
    return 'Покрытие грязезащитное модульное';
  }
  return name;
};

/** Наименование документа (вторая строка графы 1). */
export const ESKD_DOCUMENT_TITLE = 'Условная схема для сборки ковра';

/** Форматирование даты для основной надписи: ДД.ММ.ГГ. */
export const formatEskdDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm2 = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}.${mm2}.${yy}`;
};
