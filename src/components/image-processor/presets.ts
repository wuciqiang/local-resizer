import type { QuickDimensionPreset, QuickSizePreset } from './types';

export const MIME_LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

export const SIZE_PRESETS: QuickSizePreset[] = [
  { label: '50 KB', value: '50', unit: 'kb' },
  { label: '200 KB', value: '200', unit: 'kb' },
  { label: '2 MB', value: '2', unit: 'mb' },
];

export const DIMENSION_PRESETS: QuickDimensionPreset[] = [
  { label: '1280 x 720', width: 1280, height: 720 },
  { label: '1920 x 1080', width: 1920, height: 1080 },
  { label: '1080 x 1080', width: 1080, height: 1080 },
];
