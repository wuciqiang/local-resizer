import { canvasToBlob, loadImage, resetCanvas } from './image/canvas';
import { assertCanvasDimensions } from './image/limits';

export type ConversionOutputType = 'image/jpeg' | 'image/png';

export interface ConvertImageOptions {
  file: File;
  outputType: ConversionOutputType;
  quality?: number;
  backgroundColor?: string;
}

export interface ConvertImageResult {
  blob: Blob;
  width: number;
  height: number;
  inputFormat: string;
  outputFormat: ConversionOutputType;
}

const SUPPORTED_INPUT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export async function convertImage({
  backgroundColor = '#ffffff',
  file,
  outputType,
  quality = 0.92,
}: ConvertImageOptions): Promise<ConvertImageResult> {
  validateOptions(file, outputType, quality, backgroundColor);

  const image = await loadImage(file);
  let canvas: HTMLCanvasElement | undefined;

  try {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    assertCanvasDimensions(width, height);

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas is not available in this browser.');
    }

    if (outputType === 'image/jpeg') {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(image, 0, 0, width, height);

    const blob = outputType === 'image/png'
      ? await canvasToBlob(canvas, outputType)
      : await canvasToBlob(canvas, outputType, quality);
    if (blob.type !== outputType) {
      throw new Error('The browser returned an unexpected output format.');
    }

    return {
      blob,
      width,
      height,
      inputFormat: file.type,
      outputFormat: outputType,
    };
  } finally {
    if (canvas) {
      resetCanvas(canvas);
    }
    URL.revokeObjectURL(image.src);
  }
}

export function getConversionDownloadName(
  sourceName: string,
  outputType: ConversionOutputType,
): string {
  const extension = outputType === 'image/jpeg' ? '.jpg' : '.png';
  const lastDot = sourceName.lastIndexOf('.');
  const baseName = lastDot > 0 ? sourceName.slice(0, lastDot) : sourceName;
  return `${baseName || 'converted-image'}${extension}`;
}

function validateOptions(
  file: File,
  outputType: ConversionOutputType,
  quality: number,
  backgroundColor: string,
): void {
  if (!SUPPORTED_INPUT_TYPES.has(file.type)) {
    throw new Error('Only static JPEG, PNG, and WebP images are supported.');
  }

  if (file.type === outputType) {
    const label = outputType === 'image/jpeg' ? 'JPEG' : 'PNG';
    throw new Error(`This file is already ${label}.`);
  }

  if (outputType === 'image/jpeg' && (!Number.isFinite(quality) || quality <= 0 || quality > 1)) {
    throw new Error('JPEG quality must be greater than 0 and no more than 1.');
  }

  if (outputType === 'image/jpeg' && !/^#[0-9a-f]{6}$/i.test(backgroundColor)) {
    throw new Error('Choose a valid six-digit background color.');
  }
}
