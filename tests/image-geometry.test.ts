import { describe, expect, it } from 'vitest';
import {
  getContainScale,
  getCoverScale,
  getScaledDimensions,
} from '../src/lib/image/geometry';
import { getTrimBoundsFromImageData } from '../src/lib/image/trim';
import { getSplitRects } from '../src/lib/split';

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

  it('keeps the whole image visible for contain-mode YouTube-style canvases', () => {
    const scale = getContainScale(1000, 2000, 2560, 1440);
    const scaled = getScaledDimensions(1000, 2000, scale);
    expect(scaled).toEqual({ width: 720, height: 1440 });
    expect(scaled.width).toBeLessThan(2560);
    expect(scaled.height).toBe(1440);
  });
});

describe('trim bounds helper', () => {
  it('detects the tight non-white non-transparent bounds', () => {
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);

    for (let index = 3; index < data.length; index += 4) {
      data[index] = 255;
    }

    const setPixel = (x: number, y: number, rgba: [number, number, number, number]) => {
      const offset = (y * width + x) * 4;
      data[offset] = rgba[0];
      data[offset + 1] = rgba[1];
      data[offset + 2] = rgba[2];
      data[offset + 3] = rgba[3];
    };

    setPixel(1, 1, [10, 10, 10, 255]);
    setPixel(2, 2, [20, 20, 20, 255]);

    expect(getTrimBoundsFromImageData(data, width, height)).toEqual({
      left: 1,
      top: 1,
      right: 2,
      bottom: 2,
      width: 2,
      height: 2,
    });
  });

  it('returns null when the image is fully blank', () => {
    const width = 3;
    const height = 2;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    for (let index = 3; index < data.length; index += 4) {
      data[index] = 0;
    }

    expect(getTrimBoundsFromImageData(data, width, height)).toBeNull();
  });
});

describe('split rect helper', () => {
  it('splits uneven dimensions into a complete grid without gaps', () => {
    expect(getSplitRects(100, 80, 3, 2)).toEqual([
      { row: 1, column: 1, sourceX: 0, sourceY: 0, width: 50, height: 27 },
      { row: 1, column: 2, sourceX: 50, sourceY: 0, width: 50, height: 27 },
      { row: 2, column: 1, sourceX: 0, sourceY: 27, width: 50, height: 26 },
      { row: 2, column: 2, sourceX: 50, sourceY: 27, width: 50, height: 26 },
      { row: 3, column: 1, sourceX: 0, sourceY: 53, width: 50, height: 27 },
      { row: 3, column: 2, sourceX: 50, sourceY: 53, width: 50, height: 27 },
    ]);
  });
});
