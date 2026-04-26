import type { ProcessedFile } from './types';

export function getInitialSizeUnit(targetSizeBytes?: number): 'kb' | 'mb' {
  if (!targetSizeBytes || targetSizeBytes < 1024 * 1024) {
    return 'kb';
  }

  return 'mb';
}

export function getInitialSizeValue(targetSizeBytes?: number): string {
  if (!targetSizeBytes) {
    return '200';
  }

  if (targetSizeBytes >= 1024 * 1024) {
    const value = targetSizeBytes / (1024 * 1024);
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  return String(Math.round(targetSizeBytes / 1024));
}

export function parseTargetSize(value: string, unit: 'kb' | 'mb'): number | undefined {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return undefined;
  }

  return unit === 'mb'
    ? Math.round(numericValue * 1024 * 1024)
    : Math.round(numericValue * 1024);
}

export function parseDimensions(
  widthValue: string,
  heightValue: string,
): { width: number; height: number } | undefined {
  const width = Number.parseInt(widthValue, 10);
  const height = Number.parseInt(heightValue, 10);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return undefined;
  }

  return { width, height };
}

export async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const image = new Image();
  image.src = URL.createObjectURL(file);

  try {
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(image.src);
  }
}

export function revokeUrls(items: Array<{ url: string }>): void {
  for (const item of items) {
    URL.revokeObjectURL(item.url);
  }
}

export function fmtBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${formatDecimal(bytes / 1024)} KB`;
  }
  return `${formatDecimal(bytes / (1024 * 1024))} MB`;
}

export function sizeChange(originalSize: number, processedSize: number): {
  direction: 'saved' | 'increased' | 'same';
  bytes: number;
  percent: number;
} {
  const delta = processedSize - originalSize;
  const direction = delta > 0 ? 'increased' : delta < 0 ? 'saved' : 'same';
  const percent = originalSize > 0 ? Math.round((Math.abs(delta) / originalSize) * 100) : 0;

  return {
    direction,
    bytes: Math.abs(delta),
    percent,
  };
}

export function outputFormatLabel(outputFormat?: string): string | undefined {
  if (outputFormat === 'image/webp') {
    return 'Converted to WebP';
  }

  if (outputFormat === 'image/jpeg') {
    return 'JPEG output';
  }

  if (outputFormat === 'image/png') {
    return 'PNG output';
  }

  return undefined;
}

export function tabClass(active: boolean): string {
  return [
    'px-3.5 py-2 rounded-xl text-sm font-medium transition-all border',
    active
      ? 'bg-teal-600 border-teal-600 text-white shadow-soft'
      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-teal-300 hover:text-teal-700',
  ].join(' ');
}

export function getBatchProgress(
  index: number,
  total: number,
  percent: number,
): number {
  const fileBase = Math.round((index / total) * 100);
  const fileShare = Math.round((1 / total) * 100);
  return Math.min(100, fileBase + Math.round((percent / 100) * fileShare));
}

export function getDownloadName(result: Pick<ProcessedFile, 'name' | 'outputFormat'>): string {
  if (result.outputFormat !== 'image/webp' || result.name.endsWith('.webp')) {
    return result.name;
  }

  return result.name.replace(/\.[^.]+$/, '.webp');
}

function formatDecimal(value: number): string {
  return Number(value.toFixed(1)).toString();
}
