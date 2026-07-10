import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadImage } from '../src/lib/image/canvas';
import { readEncodedImageDimensions } from '../src/lib/image/dimensions';

describe('encoded image dimensions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads PNG dimensions from the IHDR header', async () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.set([0x49, 0x48, 0x44, 0x52], 12);
    bytes.set([0x00, 0x00, 0x27, 0x11], 16);
    bytes.set([0x00, 0x00, 0x00, 0x64], 20);

    await expect(readEncodedImageDimensions(new Blob([bytes])))
      .resolves.toEqual({ width: 10001, height: 100 });
  });

  it('reads JPEG dimensions before pixel decoding', async () => {
    const bytes = new Uint8Array(53);
    bytes.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x22], 0);
    bytes.set([
      0xff, 0xc0, 0x00, 0x0b, 0x08,
      0x17, 0x70,
      0x1f, 0x40,
      0x01, 0x01, 0x11, 0x00,
      0xff, 0xd9,
    ], 38);

    await expect(readEncodedImageDimensions(new Blob([bytes])))
      .resolves.toEqual({ width: 8000, height: 6000 });
  });

  it('reads extended WebP canvas dimensions', async () => {
    const bytes = new Uint8Array(30);
    bytes.set([0x52, 0x49, 0x46, 0x46], 0);
    bytes.set([0x57, 0x45, 0x42, 0x50], 8);
    bytes.set([0x56, 0x50, 0x38, 0x58], 12);
    bytes.set([0x7f, 0x02, 0x00], 24);
    bytes.set([0xdf, 0x01, 0x00], 27);

    await expect(readEncodedImageDimensions(new Blob([bytes])))
      .resolves.toEqual({ width: 640, height: 480 });
  });

  it('falls back to browser decoding for unknown headers', async () => {
    await expect(readEncodedImageDimensions(new Blob([new Uint8Array([1, 2, 3, 4])])))
      .resolves.toBeUndefined();
  });

  it('does not decode supported MIME types with mismatched file signatures', async () => {
    await expect(readEncodedImageDimensions(
      new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' }),
    )).rejects.toThrow('could not be read safely');
  });

  it('fails closed for a recognized but malformed image header', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xda]);

    await expect(readEncodedImageDimensions(new Blob([bytes], { type: 'image/jpeg' })))
      .rejects.toThrow('could not be read safely');
  });

  it('rejects an oversized encoded header before creating a browser image', async () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.set([0x49, 0x48, 0x44, 0x52], 12);
    bytes.set([0x00, 0x00, 0x27, 0x11], 16);
    bytes.set([0x00, 0x00, 0x00, 0x01], 20);
    const imageConstructor = vi.fn();
    vi.stubGlobal('Image', imageConstructor);

    await expect(loadImage(new Blob([bytes], { type: 'image/png' })))
      .rejects.toThrow('source image');
    expect(imageConstructor).not.toHaveBeenCalled();
  });
});
