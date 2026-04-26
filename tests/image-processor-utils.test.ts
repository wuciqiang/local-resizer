import { describe, expect, it } from 'vitest';
import {
  createZipBlob,
  getBatchProgress,
  getDownloadName,
  getInitialSizeUnit,
  getInitialSizeValue,
  outputFormatLabel,
  parseDimensions,
  parseTargetSize,
  sizeChange,
  uniqueZipEntries,
} from '../src/components/image-processor/utils';
import type { ProcessedFile } from '../src/components/image-processor/types';

describe('image processor utils', () => {
  it('derives sensible initial size controls', () => {
    expect(getInitialSizeUnit()).toBe('kb');
    expect(getInitialSizeUnit(2 * 1024 * 1024)).toBe('mb');
    expect(getInitialSizeValue()).toBe('200');
    expect(getInitialSizeValue(20 * 1024)).toBe('20');
    expect(getInitialSizeValue(1536 * 1024)).toBe('1.5');
    expect(getInitialSizeValue(200 * 1024)).toBe('200');
  });

  it('parses target sizes and dimensions safely', () => {
    expect(parseTargetSize('200', 'kb')).toBe(200 * 1024);
    expect(parseTargetSize('1.5', 'mb')).toBe(Math.round(1.5 * 1024 * 1024));
    expect(parseTargetSize('0', 'kb')).toBeUndefined();

    expect(parseDimensions('1280', '720')).toEqual({ width: 1280, height: 720 });
    expect(parseDimensions('0', '720')).toBeUndefined();
  });

  it('calculates batch progress and download names', () => {
    expect(getBatchProgress(1, 4, 50)).toBe(38);
    expect(getDownloadName({ name: 'hero.png', outputFormat: 'image/webp' })).toBe('hero.webp');
    expect(getDownloadName({ name: 'hero.webp', outputFormat: 'image/webp' })).toBe('hero.webp');
    expect(getDownloadName({ name: 'hero.png' })).toBe('hero.png');
  });

  it('describes size increases separately from savings', () => {
    expect(sizeChange(1000, 700)).toEqual({ direction: 'saved', bytes: 300, percent: 30 });
    expect(sizeChange(1000, 1300)).toEqual({ direction: 'increased', bytes: 300, percent: 30 });
    expect(sizeChange(1000, 1000)).toEqual({ direction: 'same', bytes: 0, percent: 0 });
  });

  it('labels output formats without assuming every output format is WebP', () => {
    expect(outputFormatLabel('image/webp')).toBe('Converted to WebP');
    expect(outputFormatLabel('image/png')).toBe('PNG output');
    expect(outputFormatLabel('image/jpeg')).toBe('JPEG output');
    expect(outputFormatLabel()).toBeUndefined();
  });

  it('creates unique ZIP entries for batch downloads', async () => {
    const results: ProcessedFile[] = [
      {
        name: 'hero.png',
        originalSize: 3,
        processedSize: 3,
        url: 'blob:one',
        blob: new Blob(['one'], { type: 'image/png' }),
        width: 1,
        height: 1,
        originalWidth: 1,
        originalHeight: 1,
      },
      {
        name: 'hero.png',
        originalSize: 3,
        processedSize: 3,
        url: 'blob:two',
        blob: new Blob(['two'], { type: 'image/png' }),
        width: 1,
        height: 1,
        originalWidth: 1,
        originalHeight: 1,
      },
    ];

    const entries = uniqueZipEntries(results);
    expect(entries.map((entry) => entry.name)).toEqual(['hero.png', 'hero-2.png']);

    const zip = await createZipBlob(entries);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    expect(zip.type).toBe('application/zip');
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
    expect(bytes.at(-22)).toBe(0x50);
    expect(bytes.at(-21)).toBe(0x4b);
    expect(bytes.at(-20)).toBe(0x05);
    expect(bytes.at(-19)).toBe(0x06);
  });
});
