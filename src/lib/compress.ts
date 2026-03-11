const DEFAULT_MAX_ITERATIONS = 12;
const MIN_QUALITY = 0.1;
const MAX_QUALITY = 0.98;

type CompressOptions = {
  targetKB: number;
  mimeType?: string;
  maxIterations?: number;
  maxDimension?: number;
};

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas export failed.'));
        return;
      }

      resolve(blob);
    }, mimeType, quality);
  });

const drawToCanvas = async (file: File, maxDimension: number) => {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('2D canvas is unavailable.');
  }

  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
};

export const compressImageToTarget = async (file: File, options: CompressOptions) => {
  const {
    targetKB,
    mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg',
    maxIterations = DEFAULT_MAX_ITERATIONS,
    maxDimension = 2560
  } = options;

  if (targetKB <= 0) {
    throw new Error('targetKB must be greater than zero.');
  }

  const canvas = await drawToCanvas(file, maxDimension);
  const targetBytes = targetKB * 1024;
  let low = MIN_QUALITY;
  let high = MAX_QUALITY;
  let bestBlob = await canvasToBlob(canvas, mimeType, high);
  let bestDelta = Math.abs(bestBlob.size - targetBytes);

  for (let index = 0; index < maxIterations; index += 1) {
    const quality = (low + high) / 2;
    const blob = await canvasToBlob(canvas, mimeType, quality);
    const delta = blob.size - targetBytes;

    if (Math.abs(delta) < bestDelta) {
      bestBlob = blob;
      bestDelta = Math.abs(delta);
    }

    if (delta === 0) {
      return blob;
    }

    if (delta > 0) {
      high = quality;
    } else {
      low = quality;
    }
  }

  return bestBlob;
};
