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
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  note?: string;
}

interface CompressionCandidate {
  blob: Blob;
  quality: number;
  width: number;
  height: number;
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
  } = options;
  const format = options.format || file.type || 'image/jpeg';
  const image = await loadImage(file);

  try {
    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;

    if (file.size <= targetSizeBytes) {
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

    const canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas is not available in this browser.');
    }

    context.drawImage(image, 0, 0, originalWidth, originalHeight);

    if (format.includes('png')) {
      return compressPngByScaling({
        canvas,
        image,
        file,
        format,
        maxIterations,
        originalWidth,
        originalHeight,
        targetSizeBytes,
        tolerance,
      });
    }

    return compressByQuality({
      canvas,
      file,
      format,
      maxIterations,
      originalWidth,
      originalHeight,
      targetSizeBytes,
      tolerance,
    });
  } finally {
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
    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));
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
