export const MAX_BATCH_FILES = 20;
export const MAX_BATCH_BYTES = 100 * 1024 * 1024;
export const MAX_BATCH_OUTPUT_PIXELS = 120_000_000;
export const MAX_BATCH_OUTPUT_BYTES = 100 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_EDGE = 10_000;
export const MAX_SOURCE_IMAGE_PIXELS = 50_000_000;
export const MAX_CANVAS_EDGE = 8_192;
export const MAX_CANVAS_PIXELS = 36_000_000;

export function getBatchSelectionError(
  files: Array<{ size: number }>,
  maxFiles = MAX_BATCH_FILES,
  maxBatchBytes = MAX_BATCH_BYTES,
): string | undefined {
  if (files.length > maxFiles) {
    return `You can process up to ${maxFiles} static images at a time.`;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > maxBatchBytes) {
    return `The selected files exceed the ${formatLimitBytes(maxBatchBytes)} total batch limit.`;
  }

  return undefined;
}

export function getSourceImageError(width: number, height: number): string | undefined {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return 'The image dimensions could not be read.';
  }

  if (
    width > MAX_SOURCE_IMAGE_EDGE ||
    height > MAX_SOURCE_IMAGE_EDGE ||
    width * height > MAX_SOURCE_IMAGE_PIXELS
  ) {
    return `The source image exceeds the ${MAX_SOURCE_IMAGE_EDGE}px edge or ${formatMegapixels(MAX_SOURCE_IMAGE_PIXELS)} megapixel limit.`;
  }

  return undefined;
}

export function getCanvasDimensionError(width: number, height: number): string | undefined {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return 'Enter valid output dimensions before processing.';
  }

  if (
    width > MAX_CANVAS_EDGE ||
    height > MAX_CANVAS_EDGE ||
    width * height > MAX_CANVAS_PIXELS
  ) {
    return `Output dimensions exceed the ${MAX_CANVAS_EDGE}px edge or ${formatMegapixels(MAX_CANVAS_PIXELS)} megapixel canvas limit.`;
  }

  return undefined;
}

export function getProjectedBatchOutputError(
  fileCount: number,
  width: number,
  height: number,
  maxOutputPixels = MAX_BATCH_OUTPUT_PIXELS,
): string | undefined {
  if (fileCount * width * height > maxOutputPixels) {
    return `The requested batch could exceed the ${formatMegapixels(maxOutputPixels)} megapixel total output limit. Use fewer files or smaller output dimensions.`;
  }

  return undefined;
}

export function getBatchOutputLimitError(
  totalPixels: number,
  totalBytes: number,
  maxOutputPixels = MAX_BATCH_OUTPUT_PIXELS,
  maxOutputBytes = MAX_BATCH_OUTPUT_BYTES,
): string | undefined {
  if (totalPixels > maxOutputPixels) {
    return `The processed batch exceeds the ${formatMegapixels(maxOutputPixels)} megapixel total output limit. Use fewer files or smaller output dimensions.`;
  }

  if (totalBytes > maxOutputBytes) {
    return `The processed batch exceeds the ${formatLimitBytes(maxOutputBytes)} retained output limit. Use fewer files or a smaller target.`;
  }

  return undefined;
}

export function assertSourceImageDimensions(width: number, height: number): void {
  const error = getSourceImageError(width, height);
  if (error) {
    throw new Error(error);
  }
}

export function assertCanvasDimensions(width: number, height: number): void {
  const error = getCanvasDimensionError(width, height);
  if (error) {
    throw new Error(error);
  }
}

function formatLimitBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 && bytes % (1024 * 1024) === 0) {
    return `${bytes / (1024 * 1024)}MB`;
  }

  return `${Math.round(bytes / 1024)}KB`;
}

function formatMegapixels(pixels: number): string {
  return Number((pixels / 1_000_000).toFixed(1)).toString();
}
