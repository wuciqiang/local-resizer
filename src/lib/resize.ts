import type { ResizeMode } from '../data/routes';
import { compressImage } from './compress';
import { canvasToBlob, loadImage, resetCanvas } from './image/canvas';
import { getContainScale, getCoverScale, getScaledDimensions } from './image/geometry';
import { assertCanvasDimensions } from './image/limits';
import { getTargetSizeNote, isWithinTargetTolerance } from './image/target-size';

export interface ResizeOptions {
  file: File;
  format?: string;
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

function getOutputType(fileType: string): string {
  if (fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/webp') {
    return fileType;
  }

  return 'image/jpeg';
}

function getDefaultQuality(type: string): number {
  return type === 'image/png' ? 1 : 0.92;
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

async function renderScaledBlob(
  image: HTMLImageElement,
  width: number,
  height: number,
  outputType: string,
  quality: number,
): Promise<Blob> {
  assertCanvasDimensions(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available in this browser.');
  }

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, outputType, quality);
  resetCanvas(canvas);
  return blob;
}

export async function resizeImage(options: ResizeOptions): Promise<ResizeResult> {
  const {
    file,
    format,
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
        forceCanvasSize,
        image,
        maintainAspectRatio,
        originalHeight,
        originalWidth,
        outputType: getOutputType(format ?? file.type),
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
        outputType: getOutputType(format ?? file.type),
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
  forceCanvasSize: boolean;
  image: HTMLImageElement;
  maintainAspectRatio: boolean;
  originalHeight: number;
  originalWidth: number;
  outputType: string;
  resizeMode: ResizeMode;
  targetDimensions: { width: number; height: number };
}): Promise<ResizeResult> {
  const {
    backgroundColor,
    forceCanvasSize,
    image,
    maintainAspectRatio,
    originalHeight,
    originalWidth,
    outputType,
    resizeMode,
    targetDimensions,
  } = args;
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
    assertCanvasDimensions(targetWidth, targetHeight);
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

    assertCanvasDimensions(finalWidth, finalHeight);
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    context.drawImage(image, 0, 0, finalWidth, finalHeight);
  }

  const blob = await canvasToBlob(canvas, outputType, getDefaultQuality(outputType));
  resetCanvas(canvas);

  return {
    blob,
    width: forceCanvasSize ? targetWidth : finalWidth,
    height: forceCanvasSize ? targetHeight : finalHeight,
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
  outputType: string;
  targetSizeBytes: number;
  tolerance: number;
}): Promise<ResizeResult> {
  const {
    file,
    image,
    maxIterations,
    originalHeight,
    originalWidth,
    outputType,
    targetSizeBytes,
    tolerance,
  } = args;
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

  const upperBound = targetSizeBytes;

  const baseQuality = getDefaultQuality(outputType);
  let low = 0.05;
  let high = 1;
  let bestUnder: SizeCandidate | null = null;
  let bestOver: SizeCandidate | null = null;

  for (let index = 0; index < maxIterations; index += 1) {
    const scale = (low + high) / 2;
    const { width, height } = getScaledDimensions(originalWidth, originalHeight, scale);
    const blob = await renderScaledBlob(image, width, height, outputType, baseQuality);
    const distance = Math.abs(blob.size - targetSizeBytes);

    if (isWithinTargetTolerance(blob.size, targetSizeBytes, tolerance)) {
      return {
        blob,
        width,
        height,
        originalWidth,
        originalHeight,
        note: `Reduced pixel dimensions from ${originalWidth} x ${originalHeight} to ${width} x ${height} to fit the requested size budget.`,
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

    if (compressedCandidate.blob.size <= targetSizeBytes &&
        (!selected || compressedCandidate.distance < selected.distance)) {
      selected = compressedCandidate;
    } else if (compressedCandidate.blob.size > targetSizeBytes &&
        (!bestOver || compressedCandidate.blob.size < bestOver.blob.size)) {
      bestOver = compressedCandidate;
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
    note: [
      `Reduced pixel dimensions from ${originalWidth} x ${originalHeight} to ${selected.width} x ${selected.height} to fit the requested size budget.`,
      getTargetSizeNote(selected.blob.size, targetSizeBytes, tolerance),
    ].filter(Boolean).join(' '),
  };
}
