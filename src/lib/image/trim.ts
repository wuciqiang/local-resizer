import { loadImage } from './canvas';
import { assertCanvasDimensions } from './limits';

export interface TrimBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface TrimOptions {
  file: File;
  tolerance?: number;
}

function isOpaquePixel(data: Uint8ClampedArray, index: number, tolerance: number): boolean {
  const alpha = data[index + 3] ?? 0;
  if (alpha <= tolerance) {
    return false;
  }

  const red = data[index] ?? 255;
  const green = data[index + 1] ?? 255;
  const blue = data[index + 2] ?? 255;

  return red < 255 - tolerance || green < 255 - tolerance || blue < 255 - tolerance;
}

export function getTrimBoundsFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance = 8,
): TrimBounds | null {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (!isOpaquePixel(data, index, tolerance)) {
        continue;
      }

      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    return null;
  }

  return {
    left,
    top,
    right,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

export async function detectTrimBounds({
  file,
  tolerance = 8,
}: TrimOptions): Promise<TrimBounds | null> {
  const image = await loadImage(file);

  try {
    assertCanvasDimensions(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Canvas is not available in this browser.');
    }

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return getTrimBoundsFromImageData(imageData.data, imageData.width, imageData.height, tolerance);
  } finally {
    URL.revokeObjectURL(image.src);
  }
}
