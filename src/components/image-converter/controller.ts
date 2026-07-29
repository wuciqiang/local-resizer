import type { ConversionOutputType } from '../../lib/convert';
import { readEncodedImageDimensions } from '../../lib/image/dimensions';
import {
  assertCanvasDimensions,
  assertSourceImageDimensions,
} from '../../lib/image/limits';

export type ConverterValidationCode =
  | 'invalid_type'
  | 'same_format'
  | 'file_too_large'
  | 'invalid_image'
  | 'animated_image'
  | 'source_too_large';

export class ConverterValidationError extends Error {
  readonly code: ConverterValidationCode;

  constructor(code: ConverterValidationCode, message: string) {
    super(message);
    this.name = 'ConverterValidationError';
    this.code = code;
  }
}

export interface InspectConverterFileOptions {
  acceptedTypes: string[];
  maxFileSize: number;
  outputType: ConversionOutputType;
}

export interface InspectedConverterFile {
  file: File;
  width: number;
  height: number;
}

export type SizeChangeDirection = 'larger' | 'smaller' | 'same';

export interface SizeChangeSummary {
  differenceBytes: number;
  direction: SizeChangeDirection;
  percentageLabel: string;
}

export interface ConverterNextStep {
  body: string;
  href: string;
  label: string;
}

export async function inspectConverterFile(
  file: File,
  options: InspectConverterFileOptions,
): Promise<InspectedConverterFile> {
  if (file.type === options.outputType) {
    const label = options.outputType === 'image/jpeg' ? 'JPEG' : 'PNG';
    throw new ConverterValidationError(
      'same_format',
      `This file is already ${label}.`,
    );
  }

  if (!options.acceptedTypes.includes(file.type)) {
    throw new ConverterValidationError(
      'invalid_type',
      `Unsupported file type for this page: ${file.name}.`,
    );
  }

  if (file.size > options.maxFileSize) {
    throw new ConverterValidationError(
      'file_too_large',
      `${file.name} exceeds the ${formatLimit(options.maxFileSize)} limit.`,
    );
  }

  if (!await encodedHeaderMatchesMime(file)) {
    throw new ConverterValidationError(
      'invalid_image',
      'This file does not match its reported image format.',
    );
  }

  if (file.type === 'image/webp' && await isAnimatedWebp(file)) {
    throw new ConverterValidationError(
      'animated_image',
      'Animated WebP files are not supported. Choose a static WebP image.',
    );
  }

  let dimensions;
  try {
    dimensions = await readEncodedImageDimensions(file);
  } catch {
    throw new ConverterValidationError(
      'invalid_image',
      'This file could not be decoded. It may be damaged or use a mismatched image format.',
    );
  }

  if (!dimensions) {
    throw new ConverterValidationError(
      'invalid_image',
      'This file could not be decoded. It may be damaged or use a mismatched image format.',
    );
  }

  try {
    assertSourceImageDimensions(dimensions.width, dimensions.height);
    assertCanvasDimensions(dimensions.width, dimensions.height);
  } catch (error) {
    throw new ConverterValidationError(
      'source_too_large',
      error instanceof Error ? error.message : 'This image is too large to convert safely.',
    );
  }

  return {
    file,
    width: dimensions.width,
    height: dimensions.height,
  };
}

async function encodedHeaderMatchesMime(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (file.type === 'image/jpeg') {
    return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
  }

  if (file.type === 'image/png') {
    return bytes.length >= 8 && [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ].every((value, index) => bytes[index] === value);
  }

  return file.type === 'image/webp' &&
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
}

export function qualityPercentToCanvas(quality: number): number {
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error('JPEG quality must be an integer between 1 and 100.');
  }

  return quality / 100;
}

export function summarizeSizeChange(
  originalSize: number,
  outputSize: number,
): SizeChangeSummary {
  if (originalSize <= 0 || outputSize < 0) {
    throw new Error('File sizes must be valid non-negative byte counts.');
  }

  const delta = outputSize - originalSize;
  const percentage = Math.abs(delta) / originalSize * 100;

  return {
    differenceBytes: Math.abs(delta),
    direction: delta > 0 ? 'larger' : delta < 0 ? 'smaller' : 'same',
    percentageLabel: percentage > 0 && percentage < 1
      ? '<1%'
      : `${Math.round(percentage)}%`,
  };
}

export function getConverterNextStep(
  outputType: ConversionOutputType,
  direction: SizeChangeDirection,
): ConverterNextStep | undefined {
  if (direction !== 'larger') {
    return undefined;
  }

  if (outputType === 'image/jpeg') {
    return {
      body: 'WebP is often more size-efficient than JPG, so a larger JPG can be normal. If the destination also has a byte limit, compress the converted file next.',
      href: '/compress-jpg-file/',
      label: 'Compress the JPG',
    };
  }

  return {
    body: 'Lossless PNG output can be larger than a photographic JPG or WebP source. If the destination also has a size limit, reduce its pixel dimensions next.',
    href: '/resize-png/',
    label: 'Resize the PNG',
  };
}

function formatLimit(bytes: number): string {
  if (bytes >= 1024 * 1024 && bytes % (1024 * 1024) === 0) {
    return `${bytes / (1024 * 1024)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

async function isAnimatedWebp(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 21).arrayBuffer());
  return bytes.length >= 21 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50 &&
    bytes[12] === 0x56 &&
    bytes[13] === 0x50 &&
    bytes[14] === 0x38 &&
    bytes[15] === 0x58 &&
    Boolean((bytes[20] ?? 0) & 0x02);
}
