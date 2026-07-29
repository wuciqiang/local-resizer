import { describe, expect, it } from 'vitest';
import {
  getConverterNextStep,
  inspectConverterFile,
  qualityPercentToCanvas,
  summarizeSizeChange,
} from '../src/components/image-converter/controller';

function createWebpFile(
  name = 'sample.webp',
  type = 'image/webp',
  width = 640,
  height = 480,
  animated = false,
): File {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8);
  bytes.set([0x56, 0x50, 0x38, 0x58], 12);
  bytes[20] = animated ? 0x02 : 0x00;
  writeUint24(bytes, 24, width - 1);
  writeUint24(bytes, 27, height - 1);
  return new File([bytes], name, { type });
}

describe('image converter controller helpers', () => {
  it('accepts a real supported file and returns encoded dimensions', async () => {
    await expect(inspectConverterFile(createWebpFile(), {
      acceptedTypes: ['image/webp'],
      maxFileSize: 50 * 1024 * 1024,
      outputType: 'image/jpeg',
    })).resolves.toMatchObject({
      height: 480,
      width: 640,
    });
  });

  it('rejects page-mismatched, same-format, and oversized files with stable codes', async () => {
    await expect(inspectConverterFile(
      createWebpFile('sample.webp', 'image/webp'),
      {
        acceptedTypes: ['image/jpeg'],
        maxFileSize: 50 * 1024 * 1024,
        outputType: 'image/png',
      },
    )).rejects.toMatchObject({ code: 'invalid_type' });

    const png = new File([new Uint8Array(24)], 'sample.png', { type: 'image/png' });
    await expect(inspectConverterFile(png, {
      acceptedTypes: ['image/jpeg', 'image/webp'],
      maxFileSize: 50 * 1024 * 1024,
      outputType: 'image/png',
    })).rejects.toMatchObject({ code: 'same_format' });

    const oversized = createWebpFile();
    Object.defineProperty(oversized, 'size', { value: 50 * 1024 * 1024 + 1 });
    await expect(inspectConverterFile(oversized, {
      acceptedTypes: ['image/webp'],
      maxFileSize: 50 * 1024 * 1024,
      outputType: 'image/jpeg',
    })).rejects.toMatchObject({ code: 'file_too_large' });
  });

  it('fails closed when a supported MIME does not match the encoded image', async () => {
    const fakeWebp = new File(['not-webp'], 'fake.webp', { type: 'image/webp' });

    await expect(inspectConverterFile(fakeWebp, {
      acceptedTypes: ['image/webp'],
      maxFileSize: 50 * 1024 * 1024,
      outputType: 'image/jpeg',
    })).rejects.toMatchObject({ code: 'invalid_image' });

    const pngBytes = new Uint8Array(24);
    pngBytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    pngBytes.set([0x49, 0x48, 0x44, 0x52], 12);
    const mislabeledPng = new File([pngBytes], 'fake.webp', { type: 'image/webp' });

    await expect(inspectConverterFile(mislabeledPng, {
      acceptedTypes: ['image/webp'],
      maxFileSize: 50 * 1024 * 1024,
      outputType: 'image/jpeg',
    })).rejects.toMatchObject({ code: 'invalid_image' });
  });

  it('rejects animated WebP before conversion', async () => {
    await expect(inspectConverterFile(
      createWebpFile('animated.webp', 'image/webp', 640, 480, true),
      {
        acceptedTypes: ['image/webp'],
        maxFileSize: 50 * 1024 * 1024,
        outputType: 'image/jpeg',
      },
    )).rejects.toMatchObject({ code: 'animated_image' });
  });

  it('converts the visible quality percentage to a Canvas value', () => {
    expect(qualityPercentToCanvas(92)).toBe(0.92);
    expect(() => qualityPercentToCanvas(0)).toThrow('between 1 and 100');
    expect(() => qualityPercentToCanvas(101)).toThrow('between 1 and 100');
  });

  it('summarizes output size changes without hiding sub-percent differences', () => {
    expect(summarizeSizeChange(1000, 1500)).toEqual({
      differenceBytes: 500,
      direction: 'larger',
      percentageLabel: '50%',
    });
    expect(summarizeSizeChange(1000, 600)).toEqual({
      differenceBytes: 400,
      direction: 'smaller',
      percentageLabel: '40%',
    });
    expect(summarizeSizeChange(1000, 1000)).toEqual({
      differenceBytes: 0,
      direction: 'same',
      percentageLabel: '0%',
    });
    expect(summarizeSizeChange(1000, 1001).percentageLabel).toBe('<1%');
  });

  it('offers a format-specific next step only when conversion increases file size', () => {
    expect(getConverterNextStep('image/jpeg', 'larger')).toEqual({
      body: expect.stringContaining('WebP is often more size-efficient'),
      href: '/compress-jpg-file/',
      label: 'Compress the JPG',
    });
    expect(getConverterNextStep('image/png', 'larger')).toEqual({
      body: expect.stringContaining('Lossless PNG output can be larger'),
      href: '/resize-png/',
      label: 'Resize the PNG',
    });
    expect(getConverterNextStep('image/jpeg', 'smaller')).toBeUndefined();
    expect(getConverterNextStep('image/png', 'same')).toBeUndefined();
  });
});

function writeUint24(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
  bytes[offset + 2] = (value >> 16) & 0xff;
}
