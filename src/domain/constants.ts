export const PLANK_WIDTH_MM = 28.2;
export const PLANK_HEIGHT_MM = 13;
export const SCRAPER_WIDTH_MM = 3;
export const SCRAPER_HEIGHT_MM = 19.1;
/** Номинальный зазор демпфер-проставки между ламелями, мм. */
export const MODULE_GAP_MM = 5;
/** Ход одной проставки при подгоне, мм. */
export const SPACER_GAP_MIN_MM = 4.5;
export const SPACER_GAP_MAX_MM = 5.5;
/**
 * Длина ковра по ламелям, начиная с которой подгон проставками обязателен.
 * Это больше 28 ламелей и 27 проставок.
 */
export const EXACT_SPACER_FIT_MIN_LENGTH_MM = 700;

export const CABLE_EDGE_OFFSET_DEFAULT_MM = 100;
export const CABLE_EDGE_OFFSET_MIN_MM = 100;
export const CABLE_EDGE_OFFSET_MAX_MM = 150;

export const CABLE_SPACING_MIN_MM = 300;
export const CABLE_SPACING_MAX_MM = 400;
export const MAX_CABLES = 10;

export const PIT_INSET_MM = 10;

/** Минимальный заказной габарит (ширина и длина), мм. */
export const MIN_ORDER_DIMENSION_MM = 100;
/** Максимальная ширина ковра (вдоль профиля), мм. */
export const MAX_CARPET_WIDTH_MM = 3000;
/** Практический верхний предел длины ковра (по планкам), мм. */
export const MAX_CARPET_LENGTH_MM = 50_000;
