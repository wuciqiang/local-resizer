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

vi.mock('../src/lib/compress', () => ({
  compressImage: vi.fn(),
}));

import { resizeImage } from '../src/lib/resize';

describe('resize output format', () => {
  beforeEach(() => {
    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      restore: vi.fn(),
      save: vi.fn(),
    };
    const canvas = {
      getContext: vi.fn(() => context),
      height: 0,
      width: 0,
    };

    vi.stubGlobal('document', {
      createElement: vi.fn(() => canvas),
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    mocks.loadImage.mockResolvedValue({
      naturalHeight: 100,
      naturalWidth: 200,
      src: 'blob:test-image',
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

  it('encodes the canvas in the requested format instead of relabeling source bytes', async () => {
    const source = new File(['jpeg-source'], 'signature.jpg', { type: 'image/jpeg' });
    const result = await resizeImage({
      file: source,
      format: 'image/png',
      forceCanvasSize: true,
      resizeMode: 'contain',
      targetDimensions: { width: 800, height: 300 },
    });

    expect(mocks.canvasToBlob).toHaveBeenCalledWith(expect.anything(), 'image/png', 1);
    expect(result.blob.type).toBe('image/png');
  });
});
