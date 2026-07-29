import { assertSourceImageDimensions } from './limits';
import { assertEncodedImageDimensions } from './dimensions';

export async function loadImage(file: Blob): Promise<HTMLImageElement> {
  await assertEncodedImageDimensions(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      try {
        assertSourceImageDimensions(image.naturalWidth, image.naturalHeight);
        resolve(image);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load the image file.'));
    };
    image.src = url;
  });
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('Failed to create an output blob.'));
    }, type, quality);
  });
}

export function resetCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}
