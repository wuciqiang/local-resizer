import type { ResizeMode } from '../data/routes';
import { compressImage } from './compress';

export interface ResizeOptions {
  file: File;
  targetDimensions?: { width: number; height: number };
  targetSizeBytes?: number;
  maintainAspectRatio?: boolean;
  resizeMode?: ResizeMode;
  forceCanvasSize?: boolean;
  backgroundColor?: string;
  maxIterations?: number;
  tolerance?: number;
}

export interface ResizeResult {
  blob: Blob;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  note?: string;
}

interface SizeCandidate {
  blob: Blob;
  width: number;
  height: number;
  scale: number;
  distance: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load the image file.'));
    };
    image.src = url;
  });
}

function getOutputType(fileType: string): string {
  if (fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/webp') {
    return fileType;
  }

  return 'image/jpeg';
}

function getDefaultQuality(type: string): number {
  return type === 'image/png' ? 1 : 0.92;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
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

function fillCanvasBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  outputType: string,
  backgroundColor?: string,
): void {
  const fill = backgroundColor || (outputType === 'image/jpeg' ? '#ffffff' : 'transparent');
  if (fill === 'transparent') {
    context.clearRect(0, 0, width, height);
    return;
  }

  context.save();
  context.fillStyle = fill;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function getContainScale(originalWidth: number, originalHeight: number, targetWidth: number, targetHeight: number): number {
  return Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
}

function getCoverScale(originalWidth: number, originalHeight: number, targetWidth: number, targetHeight: number): number {
  return Math.max(targetWidth / originalWidth, targetHeight / originalHeight);
}

async function renderScaledBlob(
  image: HTMLImageElement,
  width: number,
  height: number,
  outputType: string,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available in this browser.');
  }

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, outputType, quality);
  canvas.width = 0;
  canvas.height = 0;
  return blob;
}

export async function resizeImage(options: ResizeOptions): Promise<ResizeResult> {
  const {
    file,
    targetDimensions,
    targetSizeBytes,
    maintainAspectRatio = true,
    resizeMode = 'fit',
    forceCanvasSize = false,
    backgroundColor,
    maxIterations = 12,
    tolerance = 0.05,
  } = options;
  const image = await loadImage(file);

  try {
    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;

    if (targetDimensions) {
      return resizeToDimensions({
        backgroundColor,
        file,
        forceCanvasSize,
        image,
        maintainAspectRatio,
        originalHeight,
        originalWidth,
        resizeMode,
        targetDimensions,
      });
    }

    if (targetSizeBytes) {
      return resizeToTargetFileSize({
        file,
        image,
        maxIterations,
        originalHeight,
        originalWidth,
        targetSizeBytes,
        tolerance,
      });
    }

    return {
      blob: file,
      width: originalWidth,
      height: originalHeight,
      originalWidth,
      originalHeight,
      note: 'No resize settings were provided, so the original file was kept.',
    };
  } finally {
    URL.revokeObjectURL(image.src);
  }
}

async function resizeToDimensions(args: {
  backgroundColor?: string;
  file: File;
  forceCanvasSize: boolean;
  image: HTMLImageElement;
  maintainAspectRatio: boolean;
  originalHeight: number;
  originalWidth: number;
  resizeMode: ResizeMode;
  targetDimensions: { width: number; height: number };
}): Promise<ResizeResult> {
  const {
    backgroundColor,
    file,
    forceCanvasSize,
    image,
    maintainAspectRatio,
    originalHeight,
    originalWidth,
    resizeMode,
    targetDimensions,
  } = args;
  const outputType = getOutputType(file.type);
  const targetWidth = Math.max(1, Math.round(targetDimensions.width));
  const targetHeight = Math.max(1, Math.round(targetDimensions.height));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas is not available in this browser.');
  }

  let finalWidth = targetWidth;
  let finalHeight = targetHeight;
  let note: string | undefined;

  if (forceCanvasSize) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    fillCanvasBackground(context, targetWidth, targetHeight, outputType, backgroundColor);

    if (!maintainAspectRatio || resizeMode === 'stretch') {
      context.drawImage(image, 0, 0, targetWidth, targetHeight);
    } else {
      const scale = resizeMode === 'cover'
        ? getCoverScale(originalWidth, originalHeight, targetWidth, targetHeight)
        : getContainScale(originalWidth, originalHeight, targetWidth, targetHeight);
      const drawWidth = Math.max(1, Math.round(originalWidth * scale));
      const drawHeight = Math.max(1, Math.round(originalHeight * scale));
      const offsetX = Math.round((targetWidth - drawWidth) / 2);
      const offsetY = Math.round((targetHeight - drawHeight) / 2);
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      if (resizeMode === 'contain' && (drawWidth !== targetWidth || drawHeight !== targetHeight)) {
        note = `The image was fitted inside an exact ${targetWidth} x ${targetHeight} canvas without distortion.`;
      }
    }
  } else {
    if (!maintainAspectRatio || resizeMode === 'stretch') {
      finalWidth = targetWidth;
      finalHeight = targetHeight;
    } else {
      const scale = getContainScale(originalWidth, originalHeight, targetWidth, targetHeight);
      finalWidth = Math.max(1, Math.round(originalWidth * scale));
      finalHeight = Math.max(1, Math.round(originalHeight * scale));
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;
    context.drawImage(image, 0, 0, finalWidth, finalHeight);
  }

  const blob = await canvasToBlob(canvas, outputType, getDefaultQuality(outputType));

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    originalWidth,
    originalHeight,
    note,
  };
}

async function resizeToTargetFileSize(args: {
  file: File;
  image: HTMLImageElement;
  maxIterations: number;
  originalHeight: number;
  originalWidth: number;
  targetSizeBytes: number;
  tolerance: number;
}): Promise<ResizeResult> {
  const {
    file,
    image,
    maxIterations,
    originalHeight,
    originalWidth,
    targetSizeBytes,
    tolerance,
  } = args;
  const outputType = getOutputType(file.type);

  if (file.size <= targetSizeBytes) {
    return {
      blob: file,
      width: originalWidth,
      height: originalHeight,
      originalWidth,
      originalHeight,
      note: 'The original file was already within the requested size budget.',
    };
  }

  const allowedDifference = targetSizeBytes * tolerance;
  const upperBound = targetSizeBytes + allowedDifference;

  if (outputType !== 'image/png') {
    const compressed = await compressImage({
      file,
      targetSizeBytes,
      format: outputType,
      tolerance,
    });
    if (compressed.compressedSize <= upperBound) {
      return {
        blob: compressed.blob,
        width: compressed.width,
        height: compressed.height,
        originalWidth,
        originalHeight,
        note: compressed.note,
      };
    }
  }

  const baseQuality = getDefaultQuality(outputType);
  let low = 0.05;
  let high = 1;
  let bestUnder: SizeCandidate | null = null;
  let bestOver: SizeCandidate | null = null;

  for (let index = 0; index < maxIterations; index += 1) {
    const scale = (low + high) / 2;
    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));
    const blob = await renderScaledBlob(image, width, height, outputType, baseQuality);
    const distance = Math.abs(blob.size - targetSizeBytes);

    if (distance <= allowedDifference) {
      return {
        blob,
        width,
        height,
        originalWidth,
        originalHeight,
      };
    }

    if (blob.size > upperBound) {
      if (!bestOver || blob.size < bestOver.blob.size) {
        bestOver = { blob, width, height, scale, distance };
      }
      high = scale;
    } else {
      if (!bestUnder || distance < bestUnder.distance) {
        bestUnder = { blob, width, height, scale, distance };
      }
      low = scale;
    }
  }

  let selected = bestUnder;

  if (outputType !== 'image/png' && bestOver) {
    const compressed = await compressImage({
      file: new File([bestOver.blob], file.name, { type: outputType }),
      targetSizeBytes,
      format: outputType,
      tolerance,
    });
    const compressedCandidate: SizeCandidate = {
      blob: compressed.blob,
      width: compressed.width,
      height: compressed.height,
      scale: bestOver.scale,
      distance: Math.abs(compressed.blob.size - targetSizeBytes),
    };

    if (!selected || compressedCandidate.distance < selected.distance) {
      selected = compressedCandidate;
    }
  }

  if (!selected && bestOver) {
    selected = bestOver;
  }

  if (!selected) {
    throw new Error('Unable to create a resized image for this target size.');
  }

  return {
    blob: selected.blob,
    width: selected.width,
    height: selected.height,
    originalWidth,
    originalHeight,
    note: Math.abs(selected.blob.size - targetSizeBytes) <= allowedDifference
      ? undefined
      : 'Returned the closest result the browser could create for this image.',
  };
}
