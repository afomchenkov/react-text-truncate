export const ELLIPSIS = '...';

export const PRECISION = 0.0001;

export const isEqual = (n1: number, n2: number) => Math.abs(n1 - n2) < PRECISION;

export const elementIsVisibleInViewport = (
  element: HTMLDivElement | null,
  partiallyVisible = false
): boolean => {
  if (!element) {
    return false;
  }

  const { top, left, bottom, right } = element.getBoundingClientRect();
  const { innerHeight, innerWidth } = window;
  return partiallyVisible
    ? ((top > 0 && top < innerHeight) ||
      (bottom > 0 && bottom < innerHeight)) &&
    ((left > 0 && left < innerWidth) || (right > 0 && right < innerWidth))
    : top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
}

export const buildTruncated = (text: string, slice: number, tailText: string): string => {
  return `${text.slice(0, slice)}${ELLIPSIS}${tailText}`;
}
