import { assertSourceImageDimensions } from './limits';

export interface EncodedImageDimensions {
  width: number;
  height: number;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export async function readEncodedImageDimensions(
  blob: Blob,
): Promise<EncodedImageDimensions | undefined> {
  const prefix = new Uint8Array(
    await blob.slice(0, Math.min(blob.size, 32)).arrayBuffer(),
  );

  if (isPng(prefix)) {
    return requireDimensions(readPngDimensions(prefix));
  }

  if (isWebp(prefix)) {
    return requireDimensions(readWebpDimensions(prefix));
  }

  if (isJpeg(prefix)) {
    return requireDimensions(await readJpegDimensions(blob));
  }

  if (['image/jpeg', 'image/png', 'image/webp'].includes(blob.type.toLowerCase())) {
    throw new Error('The encoded image dimensions could not be read safely.');
  }

  return undefined;
}

export async function assertEncodedImageDimensions(blob: Blob): Promise<void> {
  const dimensions = await readEncodedImageDimensions(blob);
  if (dimensions) {
    assertSourceImageDimensions(dimensions.width, dimensions.height);
  }
}

function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

function readPngDimensions(bytes: Uint8Array): EncodedImageDimensions | undefined {
  if (
    bytes.length < 24 ||
    bytes[12] !== 0x49 ||
    bytes[13] !== 0x48 ||
    bytes[14] !== 0x44 ||
    bytes[15] !== 0x52
  ) {
    return undefined;
  }

  return validDimensions(
    readUint32BigEndian(bytes, 16),
    readUint32BigEndian(bytes, 20),
  );
}

function isWebp(bytes: Uint8Array): boolean {
  return bytes.length >= 16 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
}

function readWebpDimensions(bytes: Uint8Array): EncodedImageDimensions | undefined {
  const chunkType = String.fromCharCode(...bytes.slice(12, 16));

  if (chunkType === 'VP8X' && bytes.length >= 30) {
    return validDimensions(
      1 + readUint24LittleEndian(bytes, 24),
      1 + readUint24LittleEndian(bytes, 27),
    );
  }

  if (chunkType === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
    const width = 1 + (bytes[21] ?? 0) + (((bytes[22] ?? 0) & 0x3f) << 8);
    const height = 1 + (((bytes[22] ?? 0) & 0xc0) >> 6) +
      ((bytes[23] ?? 0) << 2) + (((bytes[24] ?? 0) & 0x0f) << 10);
    return validDimensions(width, height);
  }

  if (
    chunkType === 'VP8 ' &&
    bytes.length >= 30 &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    const width = ((bytes[27] ?? 0) << 8 | (bytes[26] ?? 0)) & 0x3fff;
    const height = ((bytes[29] ?? 0) << 8 | (bytes[28] ?? 0)) & 0x3fff;
    return validDimensions(width, height);
  }

  return undefined;
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

async function readJpegDimensions(blob: Blob): Promise<EncodedImageDimensions | undefined> {
  let offset = 2;
  let markerCount = 0;

  while (offset < blob.size && markerCount < 1024) {
    const markerBytes = await readBlobBytes(blob, offset, 16);
    if (markerBytes.length < 2 || markerBytes[0] !== 0xff) {
      return undefined;
    }

    let markerIndex = 1;
    while (markerIndex < markerBytes.length && markerBytes[markerIndex] === 0xff) {
      markerIndex += 1;
    }
    if (markerIndex === markerBytes.length) {
      if (offset + markerBytes.length >= blob.size) {
        return undefined;
      }
      offset += markerBytes.length - 1;
      continue;
    }

    const marker = markerBytes[markerIndex];
    offset += markerIndex + 1;
    markerCount += 1;

    if (marker === undefined || marker === 0x00 || marker === 0xd9 || marker === 0xda) {
      return undefined;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      continue;
    }

    const segmentHeader = await readBlobBytes(blob, offset, 7);
    if (segmentHeader.length < 2) {
      return undefined;
    }

    const segmentLength = ((segmentHeader[0] ?? 0) << 8) | (segmentHeader[1] ?? 0);
    if (segmentLength < 2 || offset + segmentLength > blob.size) {
      return undefined;
    }

    if (isStartOfFrame(marker) && segmentLength >= 7 && segmentHeader.length >= 7) {
      const height = ((segmentHeader[3] ?? 0) << 8) | (segmentHeader[4] ?? 0);
      const width = ((segmentHeader[5] ?? 0) << 8) | (segmentHeader[6] ?? 0);
      return validDimensions(width, height);
    }

    offset += segmentLength;
  }

  return undefined;
}

function requireDimensions(
  dimensions: EncodedImageDimensions | undefined,
): EncodedImageDimensions {
  if (!dimensions) {
    throw new Error('The encoded image dimensions could not be read safely.');
  }

  return dimensions;
}

function isStartOfFrame(marker: number): boolean {
  return [
    0xc0, 0xc1, 0xc2, 0xc3,
    0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb,
    0xcd, 0xce, 0xcf,
  ].includes(marker);
}

function validDimensions(
  width: number,
  height: number,
): EncodedImageDimensions | undefined {
  if (width < 1 || height < 1) {
    return undefined;
  }

  return { width, height };
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) |
    ((bytes[offset + 1] ?? 0) << 8) |
    ((bytes[offset + 2] ?? 0) << 16);
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) * 0x1000000) +
    ((bytes[offset + 1] ?? 0) << 16) +
    ((bytes[offset + 2] ?? 0) << 8) +
    (bytes[offset + 3] ?? 0);
}

async function readBlobBytes(blob: Blob, offset: number, length: number): Promise<Uint8Array> {
  return new Uint8Array(
    await blob.slice(offset, Math.min(blob.size, offset + length)).arrayBuffer(),
  );
}
