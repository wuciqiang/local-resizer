import type { QuickDimensionPreset, QuickSizePreset } from './types';

export const MIME_LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

export const SIZE_PRESETS: QuickSizePreset[] = [
  { label: '20 KB', value: '20', unit: 'kb' },
  { label: '50 KB', value: '50', unit: 'kb' },
  { label: '100 KB', value: '100', unit: 'kb' },
  { label: '200 KB', value: '200', unit: 'kb' },
  { label: '500 KB', value: '500', unit: 'kb' },
  { label: '1 MB', value: '1', unit: 'mb' },
  { label: '2 MB', value: '2', unit: 'mb' },
];

export const DIMENSION_PRESETS: QuickDimensionPreset[] = [
  { label: '851 x 315', width: 851, height: 315 },
  { label: '1080 x 1080', width: 1080, height: 1080 },
  { label: '1080 x 1920', width: 1080, height: 1920 },
  { label: '1280 x 720', width: 1280, height: 720 },
  { label: '1584 x 396', width: 1584, height: 396 },
  { label: '1920 x 1080', width: 1920, height: 1080 },
];
