import { canvasToBlob, loadImage, resetCanvas } from './image/canvas';
import { getScaledDimensions } from './image/geometry';

export type PngStrategy = 'auto' | 'webp' | 'png-scale';

export interface CompressOptions {
  file: File;
  targetSizeBytes: number;
  format?: string;
  maxIterations?: number;
  tolerance?: number;
  pngStrategy?: PngStrategy;
  onProgress?: (percent: number) => void;
}

export interface CompressResult {
  blob: Blob;
  quality: number;
  originalSize: number;
  compressedSize: number;
  iterations: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  note?: string;
  outputFormat?: string;
}

interface CompressionCandidate {
  blob: Blob;
  quality: number;
  width: number;
  height: number;
  distance: number;
}

function buildNote(blobSize: number, targetSizeBytes: number): string | undefined {
  const allowedDifference = targetSizeBytes * 0.05;
  if (Math.abs(blobSize - targetSizeBytes) <= allowedDifference) {
    return undefined;
  }

  return 'Returned the closest result the browser could create for this image.';
}

export async function compressImage(options: CompressOptions): Promise<CompressResult> {
  const {
    file,
    targetSizeBytes,
    maxIterations = 20,
    tolerance = 0.05,
    pngStrategy = 'auto',
    onProgress,
  } = options;
  const format = options.format || file.type || 'image/jpeg';
  const image = await loadImage(file);
  let canvas: HTMLCanvasElement | undefined;

  try {
    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;

    if (file.size <= targetSizeBytes) {
      onProgress?.(100);
      return {
        blob: file,
        quality: 1,
        originalSize: file.size,
        compressedSize: file.size,
        iterations: 0,
        width: originalWidth,
        height: originalHeight,
        originalWidth,
        originalHeight,
        note: 'The original file was already within the requested size budget.',
      };
    }

    canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas is not available in this browser.');
    }

    context.drawImage(image, 0, 0, originalWidth, originalHeight);
    onProgress?.(10);

    if (format.includes('png')) {
      if (pngStrategy === 'auto' || pngStrategy === 'png-scale') {
        const pngRedrawn = await canvasToBlob(canvas, 'image/png', 1);
        onProgress?.(20);
        if (pngRedrawn.size <= targetSizeBytes + targetSizeBytes * tolerance) {
          onProgress?.(100);
          return {
            blob: pngRedrawn,
            quality: 1,
            originalSize: file.size,
            compressedSize: pngRedrawn.size,
            iterations: 1,
            width: originalWidth,
            height: originalHeight,
            originalWidth,
            originalHeight,
          };
        }
      }

      if (pngStrategy === 'webp') {
        onProgress?.(30);
        const webpResult = await compressByQuality({
          canvas, file, format: 'image/webp', maxIterations,
          originalWidth, originalHeight, targetSizeBytes, tolerance,
        });
        onProgress?.(100);
        return { ...webpResult, outputFormat: 'image/webp' };
      }

      if (pngStrategy === 'png-scale') {
        onProgress?.(30);
        const scalingResult = await compressPngByScaling({
          canvas, image, file, format, maxIterations,
          originalWidth, originalHeight, targetSizeBytes, tolerance,
        });
        onProgress?.(100);
        return {
          ...scalingResult,
          note: scalingResult.note ??
            (scalingResult.width !== originalWidth
              ? `PNG compression required dimension scaling (${originalWidth}x${originalHeight} → ${scalingResult.width}x${scalingResult.height}).`
              : undefined),
        };
      }

      // auto: try webp first, then scaling
      onProgress?.(30);
      const webpResult = await compressByQuality({
        canvas, file, format: 'image/webp', maxIterations,
        originalWidth, originalHeight, targetSizeBytes, tolerance,
      });
      if (webpResult.compressedSize <= targetSizeBytes + targetSizeBytes * tolerance) {
        onProgress?.(100);
        return { ...webpResult, outputFormat: 'image/webp' };
      }

      onProgress?.(60);
      const scalingResult = await compressPngByScaling({
        canvas, image, file, format, maxIterations,
        originalWidth, originalHeight, targetSizeBytes, tolerance,
      });

      if (webpResult.compressedSize <= scalingResult.compressedSize &&
          webpResult.width === originalWidth && webpResult.height === originalHeight) {
        onProgress?.(100);
        return { ...webpResult, outputFormat: 'image/webp' };
      }

      onProgress?.(100);
      return {
        ...scalingResult,
        note: scalingResult.note ??
          `PNG format required dimension scaling (${originalWidth}x${originalHeight} → ${scalingResult.width}x${scalingResult.height}) to reach the target size. Consider using WebP format to keep original dimensions.`,
      };
    }

    const result = await compressByQuality({
      canvas, file, format, maxIterations,
      originalWidth, originalHeight, targetSizeBytes, tolerance,
    });
    onProgress?.(100);
    return result;
  } finally {
    if (canvas) {
      resetCanvas(canvas);
    }
    URL.revokeObjectURL(image.src);
  }
}

async function compressByQuality(args: {
  canvas: HTMLCanvasElement;
  file: File;
  format: string;
  maxIterations: number;
  originalWidth: number;
  originalHeight: number;
  targetSizeBytes: number;
  tolerance: number;
}): Promise<CompressResult> {
  const {
    canvas,
    file,
    format,
    maxIterations,
    originalWidth,
    originalHeight,
    targetSizeBytes,
    tolerance,
  } = args;

  let low = 0.02;
  let high = 1;
  let iterations = 0;
  let bestUnder: CompressionCandidate | null = null;
  let bestAny: CompressionCandidate | null = null;
  const allowedDifference = targetSizeBytes * tolerance;
  const upperBound = targetSizeBytes + allowedDifference;

  for (let index = 0; index < maxIterations; index += 1) {
    const quality = (low + high) / 2;
    const blob = await canvasToBlob(canvas, format, quality);
    const distance = Math.abs(blob.size - targetSizeBytes);
    iterations += 1;

    if (!bestAny || distance < bestAny.distance) {
      bestAny = {
        blob,
        quality,
        width: originalWidth,
        height: originalHeight,
        distance,
      };
    }

    if (blob.size <= upperBound && (!bestUnder || distance < bestUnder.distance)) {
      bestUnder = {
        blob,
        quality,
        width: originalWidth,
        height: originalHeight,
        distance,
      };
    }

    if (distance <= allowedDifference) {
      return {
        blob,
        quality,
        originalSize: file.size,
        compressedSize: blob.size,
        iterations,
        width: originalWidth,
        height: originalHeight,
        originalWidth,
        originalHeight,
      };
    }

    if (blob.size > upperBound) {
      high = quality;
    } else {
      low = quality;
    }
  }

  const candidate = bestUnder ?? bestAny;
  if (!candidate) {
    throw new Error('Unable to create a compressed image.');
  }

  return {
    blob: candidate.blob,
    quality: candidate.quality,
    originalSize: file.size,
    compressedSize: candidate.blob.size,
    iterations,
    width: candidate.width,
    height: candidate.height,
    originalWidth,
    originalHeight,
    note: buildNote(candidate.blob.size, targetSizeBytes),
  };
}

async function compressPngByScaling(args: {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  file: File;
  format: string;
  maxIterations: number;
  originalWidth: number;
  originalHeight: number;
  targetSizeBytes: number;
  tolerance: number;
}): Promise<CompressResult> {
  const {
    canvas,
    image,
    file,
    format,
    maxIterations,
    originalWidth,
    originalHeight,
    targetSizeBytes,
    tolerance,
  } = args;
  const allowedDifference = targetSizeBytes * tolerance;
  const upperBound = targetSizeBytes + allowedDifference;
  let low = 0.05;
  let high = 1;
  let iterations = 0;
  let bestUnder: CompressionCandidate | null = null;
  let bestAny: CompressionCandidate | null = null;

  for (let index = 0; index < maxIterations; index += 1) {
    const scale = (low + high) / 2;
    const { width, height } = getScaledDimensions(originalWidth, originalHeight, scale);
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas is not available in this browser.');
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, format, 1);
    const distance = Math.abs(blob.size - targetSizeBytes);
    iterations += 1;

    if (!bestAny || distance < bestAny.distance) {
      bestAny = { blob, quality: scale, width, height, distance };
    }

    if (blob.size <= upperBound && (!bestUnder || distance < bestUnder.distance)) {
      bestUnder = { blob, quality: scale, width, height, distance };
    }

    if (distance <= allowedDifference) {
      return {
        blob,
        quality: scale,
        originalSize: file.size,
        compressedSize: blob.size,
        iterations,
        width,
        height,
        originalWidth,
        originalHeight,
      };
    }

    if (blob.size > upperBound) {
      high = scale;
    } else {
      low = scale;
    }
  }

  const candidate = bestUnder ?? bestAny;
  if (!candidate) {
    throw new Error('Unable to create a compressed PNG.');
  }

  return {
    blob: candidate.blob,
    quality: candidate.quality,
    originalSize: file.size,
    compressedSize: candidate.blob.size,
    iterations,
    width: candidate.width,
    height: candidate.height,
    originalWidth,
    originalHeight,
    note: buildNote(candidate.blob.size, targetSizeBytes),
  };
}
