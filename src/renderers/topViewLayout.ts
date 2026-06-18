export type TopViewChrome = {
  viewWidth: number;
  viewHeight: number;
  marginX: number;
  marginTop: number;
  marginBottom: number;
  dimTop: number;
  dimLeft: number;
  titleX: number;
  titleY: number;
  showTitle: boolean;
};

const DEFAULT_VIEW_WIDTH = 920;
const DEFAULT_VIEW_HEIGHT = 460;

/** Доля области рисования, занимаемая полотном в конструкторе. */
export const TOP_VIEW_MAT_SIZE_FACTOR = 0.9;

export const getTopViewChrome = (
  isFullscreen: boolean,
  viewport?: { width: number; height: number },
): TopViewChrome => {
  const hasViewport = viewport && viewport.width > 0 && viewport.height > 0;
  const viewWidth = hasViewport ? viewport.width : DEFAULT_VIEW_WIDTH;
  const viewHeight = hasViewport ? viewport.height : DEFAULT_VIEW_HEIGHT;

  if (isFullscreen) {
    return {
      viewWidth,
      viewHeight,
      marginX: 8,
      marginTop: 8,
      marginBottom: 8,
      dimTop: 28,
      dimLeft: 44,
      titleX: 8,
      titleY: 14,
      showTitle: false,
    };
  }

  return {
    viewWidth,
    viewHeight,
    marginX: 8,
    marginTop: 8,
    marginBottom: 8,
    dimTop: 26,
    dimLeft: 36,
    titleX: 8,
    titleY: 14,
    showTitle: true,
  };
};

export const getTopViewDrawable = (chrome: TopViewChrome): { width: number; height: number; originX: number; originY: number } => {
  const width = chrome.viewWidth - chrome.marginX * 2 - chrome.dimLeft;
  const height = chrome.viewHeight - chrome.marginTop - chrome.marginBottom - chrome.dimTop;
  return {
    width: Math.max(width, 1),
    height: Math.max(height, 1),
    originX: chrome.marginX + chrome.dimLeft,
    originY: chrome.marginTop + chrome.dimTop,
  };
};
