import { compressImage } from './compress';

export interface ResizeOptions {
  file: File;
  targetDimensions?: { width: number; height: number };
  targetSizeBytes?: number;
  maintainAspectRatio?: boolean;
}

export interface ResizeResult {
  blob: Blob;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function resizeImage(options: ResizeOptions): Promise<ResizeResult> {
  const { file, targetDimensions, targetSizeBytes, maintainAspectRatio = true } = options;
  const img = await loadImage(file);
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  let w: number, h: number;

  if (targetDimensions) {
    if (maintainAspectRatio) {
      const ratio = Math.min(targetDimensions.width / origW, targetDimensions.height / origH);
      w = Math.round(origW * ratio);
      h = Math.round(origH * ratio);
    } else {
      w = targetDimensions.width;
      h = targetDimensions.height;
    }
  } else if (targetSizeBytes) {
    const sizeRatio = targetSizeBytes / file.size;
    const scale = Math.sqrt(Math.min(sizeRatio, 1));
    w = Math.round(origW * scale);
    h = Math.round(origH * scale);
  } else {
    w = origW;
    h = origH;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(img.src);

  const format = file.type || 'image/jpeg';

  if (targetSizeBytes) {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), format, 0.92);
    });

    if (blob.size > targetSizeBytes * 1.05) {
      const result = await compressImage({ file: new File([blob], file.name, { type: format }), targetSizeBytes, format });
      return { blob: result.blob, width: w, height: h, originalWidth: origW, originalHeight: origH };
    }
    return { blob, width: w, height: h, originalWidth: origW, originalHeight: origH };
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), format, 0.92);
  });

  return { blob, width: w, height: h, originalWidth: origW, originalHeight: origH };
}
