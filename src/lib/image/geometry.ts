export function getContainScale(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
): number {
  return Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
}

export function getCoverScale(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
): number {
  return Math.max(targetWidth / originalWidth, targetHeight / originalHeight);
}

export function getScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  scale: number,
): { width: number; height: number } {
  return {
    width: Math.max(1, Math.round(originalWidth * scale)),
    height: Math.max(1, Math.round(originalHeight * scale)),
  };
}
