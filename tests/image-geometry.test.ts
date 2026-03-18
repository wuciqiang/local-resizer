import { describe, expect, it } from 'vitest';
import {
  getContainScale,
  getCoverScale,
  getScaledDimensions,
} from '../src/lib/image/geometry';

describe('image geometry helpers', () => {
  it('returns the smaller ratio for contain scale', () => {
    expect(getContainScale(4000, 2000, 1000, 1000)).toBe(0.25);
  });

  it('returns the larger ratio for cover scale', () => {
    expect(getCoverScale(4000, 2000, 1000, 1000)).toBe(0.5);
  });

  it('rounds scaled dimensions and keeps them at least 1px', () => {
    expect(getScaledDimensions(4000, 2000, 0.25)).toEqual({ width: 1000, height: 500 });
    expect(getScaledDimensions(3, 3, 0.01)).toEqual({ width: 1, height: 1 });
  });
});
