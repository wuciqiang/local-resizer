import { describe, expect, it } from 'vitest';
import {
  MAX_BATCH_BYTES,
  MAX_BATCH_FILES,
  MAX_BATCH_OUTPUT_BYTES,
  MAX_BATCH_OUTPUT_PIXELS,
  MAX_CANVAS_EDGE,
  MAX_SOURCE_IMAGE_EDGE,
  getBatchOutputLimitError,
  getBatchSelectionError,
  getCanvasDimensionError,
  getProjectedBatchOutputError,
  getSourceImageError,
} from '../src/lib/image/limits';

describe('image resource limits', () => {
  it('rejects oversized file selections before processing', () => {
    expect(getBatchSelectionError(
      Array.from({ length: MAX_BATCH_FILES + 1 }, () => ({ size: 1 })),
    )).toContain(String(MAX_BATCH_FILES));

    expect(getBatchSelectionError([
      { size: MAX_BATCH_BYTES / 2 + 1 },
      { size: MAX_BATCH_BYTES / 2 },
    ])).toContain('total batch limit');
  });

  it('allows a selection exactly at the configured limits', () => {
    expect(getBatchSelectionError(
      Array.from({ length: MAX_BATCH_FILES }, () => ({ size: MAX_BATCH_BYTES / MAX_BATCH_FILES })),
    )).toBeUndefined();
  });

  it('rejects source images with unsafe decoded dimensions', () => {
    expect(getSourceImageError(MAX_SOURCE_IMAGE_EDGE + 1, 1)).toContain('source image');
    expect(getSourceImageError(7500, 7000)).toContain('source image');
    expect(getSourceImageError(8000, 6000)).toBeUndefined();
  });

  it('rejects output canvases above the edge or pixel budget', () => {
    expect(getCanvasDimensionError(MAX_CANVAS_EDGE + 1, 1)).toContain('canvas limit');
    expect(getCanvasDimensionError(7000, 6000)).toContain('canvas limit');
    expect(getCanvasDimensionError(7680, 4320)).toBeUndefined();
  });

  it('rejects projected and actual batch outputs above cumulative budgets', () => {
    expect(getProjectedBatchOutputError(20, 3000, 2000)).toBeUndefined();
    expect(getProjectedBatchOutputError(20, 3001, 2000)).toContain('total output limit');

    expect(getBatchOutputLimitError(
      MAX_BATCH_OUTPUT_PIXELS,
      MAX_BATCH_OUTPUT_BYTES,
    )).toBeUndefined();
    expect(getBatchOutputLimitError(
      MAX_BATCH_OUTPUT_PIXELS + 1,
      MAX_BATCH_OUTPUT_BYTES,
    )).toContain('megapixel total output limit');
    expect(getBatchOutputLimitError(
      MAX_BATCH_OUTPUT_PIXELS,
      MAX_BATCH_OUTPUT_BYTES + 1,
    )).toContain('retained output limit');
  });
});
