import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  canvasToBlob: vi.fn(),
  loadImage: vi.fn(),
  resetCanvas: vi.fn(),
}));

vi.mock('../src/lib/image/canvas', () => ({
  canvasToBlob: mocks.canvasToBlob,
  loadImage: mocks.loadImage,
  resetCanvas: mocks.resetCanvas,
}));

import {
  convertImage,
  getConversionDownloadName,
} from '../src/lib/convert';

describe('image format conversion', () => {
  let canvas: {
    getContext: ReturnType<typeof vi.fn>;
    height: number;
    width: number;
  };
  let context: {
    drawImage: ReturnType<typeof vi.fn>;
    fillRect: ReturnType<typeof vi.fn>;
    fillStyle: string;
  };

  beforeEach(() => {
    context = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
    };
    canvas = {
      getContext: vi.fn(() => context),
      height: 0,
      width: 0,
    };

    vi.stubGlobal('document', {
      createElement: vi.fn(() => canvas),
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    mocks.loadImage.mockResolvedValue({
      naturalHeight: 480,
      naturalWidth: 640,
      src: 'blob:source-image',
    });
    mocks.canvasToBlob.mockImplementation(async (_canvas, type: string) => (
      new Blob(['encoded'], { type })
    ));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('converts WebP to JPEG at the original dimensions with a background fill', async () => {
    const file = new File(['webp-source'], 'sample.webp', { type: 'image/webp' });

    const result = await convertImage({
      backgroundColor: '#f5f5f5',
      file,
      outputType: 'image/jpeg',
      quality: 0.86,
    });

    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
    expect(context.fillStyle).toBe('#f5f5f5');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 640, 480);
    expect(context.fillRect.mock.invocationCallOrder[0])
      .toBeLessThan(context.drawImage.mock.invocationCallOrder[0]);
    expect(mocks.canvasToBlob).toHaveBeenCalledWith(canvas, 'image/jpeg', 0.86);
    expect(result).toMatchObject({
      height: 480,
      inputFormat: 'image/webp',
      outputFormat: 'image/jpeg',
      width: 640,
    });
    expect(result.blob.type).toBe('image/jpeg');
  });

  it('encodes PNG without passing a quality setting', async () => {
    const file = new File(['jpeg-source'], 'photo.jpg', { type: 'image/jpeg' });

    const result = await convertImage({
      file,
      outputType: 'image/png',
    });

    expect(context.fillRect).not.toHaveBeenCalled();
    expect(mocks.canvasToBlob).toHaveBeenCalledWith(canvas, 'image/png');
    expect(result.blob.type).toBe('image/png');
  });

  it('rejects same-format re-encoding and invalid JPEG quality', async () => {
    const jpeg = new File(['jpeg-source'], 'photo.jpg', { type: 'image/jpeg' });
    const webp = new File(['webp-source'], 'photo.webp', { type: 'image/webp' });

    await expect(convertImage({ file: jpeg, outputType: 'image/jpeg' }))
      .rejects.toThrow('already JPEG');
    await expect(convertImage({ file: webp, outputType: 'image/jpeg', quality: 2 }))
      .rejects.toThrow('quality');
    expect(mocks.loadImage).not.toHaveBeenCalled();
  });

  it('releases the source image and resets the canvas after success or failure', async () => {
    const file = new File(['webp-source'], 'sample.webp', { type: 'image/webp' });

    await convertImage({ file, outputType: 'image/jpeg' });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:source-image');
    expect(mocks.resetCanvas).toHaveBeenCalledWith(canvas);

    vi.clearAllMocks();
    mocks.canvasToBlob.mockRejectedValueOnce(new Error('encode failed'));
    await expect(convertImage({ file, outputType: 'image/jpeg' }))
      .rejects.toThrow('encode failed');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:source-image');
    expect(mocks.resetCanvas).toHaveBeenCalledWith(canvas);
  });

  it('uses an extension that matches the output MIME', () => {
    expect(getConversionDownloadName('sample.webp', 'image/jpeg')).toBe('sample.jpg');
    expect(getConversionDownloadName('holiday.photo.jpg', 'image/png')).toBe('holiday.photo.png');
    expect(getConversionDownloadName('untitled', 'image/png')).toBe('untitled.png');
  });
});
