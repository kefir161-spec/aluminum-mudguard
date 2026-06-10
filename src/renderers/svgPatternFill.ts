export const getPatternFill = (type: string): string => {
  if (type === 'rubber') return 'url(#pattern-rubber)';
  if (type === 'pile') return 'url(#pattern-pile)';
  if (type === 'brush') return 'url(#pattern-brush)';
  return 'url(#pattern-scraper-rib)';
};
