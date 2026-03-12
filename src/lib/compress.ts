export interface CompressOptions {
  file: File;
  targetSizeBytes: number;
  format?: string;
  maxIterations?: number;
  tolerance?: number;
}

export interface CompressResult {
  blob: Blob;
  quality: number;
  originalSize: number;
  compressedSize: number;
  iterations: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    const url = URL.createObjectURL(file);
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      type,
      quality,
    );
  });
}

export async function compressImage(options: CompressOptions): Promise<CompressResult> {
  const { file, targetSizeBytes, maxIterations = 20, tolerance = 0.05 } = options;
  const format = options.format || file.type || 'image/jpeg';
  const img = await loadImage(file);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  URL.revokeObjectURL(img.src);

  const isPng = format.includes('png');

  if (isPng) {
    return compressByScaling(canvas, ctx, img, file, targetSizeBytes, format, maxIterations, tolerance);
  }

  let lo = 0.0, hi = 1.0;
  let bestBlob: Blob | null = null;
  let bestQuality = 1.0;
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, format, mid);
    iterations++;

    const ratio = blob.size / targetSizeBytes;
    if (Math.abs(ratio - 1) <= tolerance) {
      return { blob, quality: mid, originalSize: file.size, compressedSize: blob.size, iterations };
    }

    if (blob.size > targetSizeBytes) {
      hi = mid;
    } else {
      lo = mid;
      bestBlob = blob;
      bestQuality = mid;
    }
  }

  if (!bestBlob) {
    bestBlob = await canvasToBlob(canvas, format, lo);
  }

  return { blob: bestBlob, quality: bestQuality, originalSize: file.size, compressedSize: bestBlob.size, iterations };
}

async function compressByScaling(
  canvas: HTMLCanvasElement,
  _ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  file: File,
  targetSizeBytes: number,
  format: string,
  maxIterations: number,
  tolerance: number,
): Promise<CompressResult> {
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;
  let lo = 0.1, hi = 1.0;
  let bestBlob: Blob | null = null;
  let bestScale = 1.0;
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    const scale = (lo + hi) / 2;
    const w = Math.round(origW * scale);
    const h = Math.round(origH * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext('2d')!;
    ctx2.drawImage(img, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, format, 1.0);
    iterations++;

    const ratio = blob.size / targetSizeBytes;
    if (Math.abs(ratio - 1) <= tolerance) {
      return { blob, quality: scale, originalSize: file.size, compressedSize: blob.size, iterations };
    }
    if (blob.size > targetSizeBytes) {
      hi = scale;
    } else {
      lo = scale;
      bestBlob = blob;
      bestScale = scale;
    }
  }

  if (!bestBlob) {
    const w = Math.round(origW * lo);
    const h = Math.round(origH * lo);
    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext('2d')!;
    ctx2.drawImage(img, 0, 0, w, h);
    bestBlob = await canvasToBlob(canvas, format, 1.0);
  }

  return { blob: bestBlob, quality: bestScale, originalSize: file.size, compressedSize: bestBlob.size, iterations };
}
