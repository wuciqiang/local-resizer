import { describe, expect, it } from 'vitest';
import {
  createZipBlob,
  getBatchProgress,
  getDownloadName,
  getSplitDownloadName,
  getInitialSizeUnit,
  getInitialSizeValue,
  outputFormatLabel,
  parseDimensions,
  parseTargetSize,
  sizeChange,
  shouldUseResizePipeline,
  tabClass,
  targetSizeResultType,
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
    expect(parseDimensions('1280.5', '720')).toBeUndefined();
  });

  it('keeps resize-to-size routes on the resize pipeline', () => {
    expect(shouldUseResizePipeline('resize', undefined, 100 * 1024)).toBe(true);
    expect(shouldUseResizePipeline('resize', { width: 1280, height: 720 })).toBe(true);
    expect(shouldUseResizePipeline('compress', undefined, 100 * 1024)).toBe(false);
  });

  it('calculates batch progress and download names', () => {
    expect(getBatchProgress(1, 4, 50)).toBe(38);
    expect(getDownloadName({ name: 'hero.png', outputFormat: 'image/webp' })).toBe('hero.webp');
    expect(getDownloadName({ name: 'hero.webp', outputFormat: 'image/webp' })).toBe('hero.webp');
    expect(getDownloadName({ name: 'hero.webp', outputFormat: 'image/jpeg' })).toBe('hero.jpg');
    expect(getDownloadName({ name: 'hero.jpg', outputFormat: 'image/png' })).toBe('hero.png');
    expect(getDownloadName({ name: 'hero', outputFormat: 'image/webp' })).toBe('hero.webp');
    expect(getDownloadName({ name: 'hero', outputFormat: 'image/jpeg' })).toBe('hero.jpg');
    expect(getDownloadName({ name: 'hero', outputFormat: 'image/png' })).toBe('hero.png');
    expect(getDownloadName({ name: 'hero.png' })).toBe('hero.png');
    expect(getDownloadName({ name: 'hero' })).toBe('hero');
    expect(getSplitDownloadName('hero', 2, 3, 'image/jpeg')).toBe('hero-r2-c3.jpg');
    expect(getSplitDownloadName('hero.png', 2, 3, 'image/png')).toBe('hero-r2-c3.png');
  });

  it('describes size increases separately from savings', () => {
    expect(sizeChange(1000, 700)).toEqual({ direction: 'saved', bytes: 300, percent: 30 });
    expect(sizeChange(1000, 1300)).toEqual({ direction: 'increased', bytes: 300, percent: 30 });
    expect(sizeChange(1000, 1000)).toEqual({ direction: 'same', bytes: 0, percent: 0 });
  });

  it('labels output formats without assuming every output format is WebP', () => {
    expect(outputFormatLabel('image/webp')).toBe('WebP output');
    expect(outputFormatLabel('image/png')).toBe('PNG output');
    expect(outputFormatLabel('image/jpeg')).toBe('JPEG output');
    expect(outputFormatLabel()).toBeUndefined();
  });

  it('uses an accessible contrast color for the active mode tab', () => {
    expect(tabClass(true)).toContain('bg-teal-700');
    expect(tabClass(true)).toContain('border-teal-700');
  });

  it('distinguishes target-size success from a result above the budget', () => {
    expect(targetSizeResultType([{ processedSize: 99 }], 100)).toBe('target_met');
    expect(targetSizeResultType([{ processedSize: 101 }], 100)).toBe('target_missed');
    expect(targetSizeResultType([{ processedSize: 101 }])).toBe('processed');
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

  it('reads ZIP entry bytes sequentially to limit peak memory', async () => {
    let activeReads = 0;
    let maxActiveReads = 0;

    const trackedBlob = (value: string) => {
      const blob = new Blob([value]);
      const read = blob.arrayBuffer.bind(blob);
      Object.defineProperty(blob, 'arrayBuffer', {
        value: async () => {
          activeReads += 1;
          maxActiveReads = Math.max(maxActiveReads, activeReads);
          await new Promise((resolve) => setTimeout(resolve, 0));
          const buffer = await read();
          activeReads -= 1;
          return buffer;
        },
      });
      return blob;
    };

    await createZipBlob([
      { name: 'one.txt', blob: trackedBlob('one') },
      { name: 'two.txt', blob: trackedBlob('two') },
    ]);

    expect(maxActiveReads).toBe(1);
  });
});
