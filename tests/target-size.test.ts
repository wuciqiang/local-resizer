import { describe, expect, it } from 'vitest';
import {
  getTargetSizeNote,
  isWithinTargetTolerance,
} from '../src/lib/image/target-size';

describe('target size helpers', () => {
  it('treats the target as a hard upper budget', () => {
    expect(isWithinTargetTolerance(100 * 1024, 100 * 1024, 0.05)).toBe(true);
    expect(isWithinTargetTolerance(96 * 1024, 100 * 1024, 0.05)).toBe(true);
    expect(isWithinTargetTolerance(94 * 1024, 100 * 1024, 0.05)).toBe(false);
    expect(isWithinTargetTolerance(101 * 1024, 100 * 1024, 0.05)).toBe(false);
  });

  it('warns when a browser result remains above the requested budget', () => {
    expect(getTargetSizeNote(101 * 1024, 100 * 1024, 0.05)).toContain('above');
    expect(getTargetSizeNote(94 * 1024, 100 * 1024, 0.05)).toContain('under');
    expect(getTargetSizeNote(98 * 1024, 100 * 1024, 0.05)).toBeUndefined();
  });
});
