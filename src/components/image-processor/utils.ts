import type { ProcessedFile } from './types';
import { loadImage } from '../../lib/image/canvas';

interface ZipEntry {
  name: string;
  blob: Blob;
}

export function getInitialSizeUnit(targetSizeBytes?: number): 'kb' | 'mb' {
  if (!targetSizeBytes || targetSizeBytes < 1024 * 1024) {
    return 'kb';
  }

  return 'mb';
}

export function getInitialSizeValue(targetSizeBytes?: number): string {
  if (!targetSizeBytes) {
    return '200';
  }

  if (targetSizeBytes >= 1024 * 1024) {
    const value = targetSizeBytes / (1024 * 1024);
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  return String(Math.round(targetSizeBytes / 1024));
}

export function parseTargetSize(value: string, unit: 'kb' | 'mb'): number | undefined {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return undefined;
  }

  return unit === 'mb'
    ? Math.round(numericValue * 1024 * 1024)
    : Math.round(numericValue * 1024);
}

export function parseDimensions(
  widthValue: string,
  heightValue: string,
): { width: number; height: number } | undefined {
  const width = Number(widthValue);
  const height = Number(heightValue);
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    return undefined;
  }

  return { width, height };
}

export function shouldUseResizePipeline(
  action: 'compress' | 'resize',
  targetDimensions?: { width: number; height: number },
  targetSizeBytes?: number,
): boolean {
  return action === 'resize' && Boolean(targetDimensions || targetSizeBytes);
}

export function targetSizeResultType(
  results: Array<{ processedSize: number }>,
  targetSizeBytes?: number,
): 'processed' | 'target_met' | 'target_missed' {
  if (!targetSizeBytes) {
    return 'processed';
  }

  return results.every((result) => result.processedSize <= targetSizeBytes)
    ? 'target_met'
    : 'target_missed';
}

export async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const image = await loadImage(file);

  try {
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(image.src);
  }
}

export function revokeUrls(items: Array<{ url: string }>): void {
  for (const item of items) {
    URL.revokeObjectURL(item.url);
  }
}

export function fmtBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${formatDecimal(bytes / 1024)} KB`;
  }
  return `${formatDecimal(bytes / (1024 * 1024))} MB`;
}

export function sizeChange(originalSize: number, processedSize: number): {
  direction: 'saved' | 'increased' | 'same';
  bytes: number;
  percent: number;
} {
  const delta = processedSize - originalSize;
  const direction = delta > 0 ? 'increased' : delta < 0 ? 'saved' : 'same';
  const percent = originalSize > 0 ? Math.round((Math.abs(delta) / originalSize) * 100) : 0;

  return {
    direction,
    bytes: Math.abs(delta),
    percent,
  };
}

export function outputFormatLabel(outputFormat?: string): string | undefined {
  if (outputFormat === 'image/webp') {
    return 'WebP output';
  }

  if (outputFormat === 'image/jpeg') {
    return 'JPEG output';
  }

  if (outputFormat === 'image/png') {
    return 'PNG output';
  }

  return undefined;
}

export function tabClass(active: boolean): string {
  return [
    'px-3.5 py-2 rounded-xl text-sm font-medium transition-all border',
    active
      ? 'bg-teal-700 border-teal-700 text-white shadow-soft'
      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-teal-300 hover:text-teal-700',
  ].join(' ');
}

export function getBatchProgress(
  index: number,
  total: number,
  percent: number,
): number {
  const fileBase = Math.round((index / total) * 100);
  const fileShare = Math.round((1 / total) * 100);
  return Math.min(100, fileBase + Math.round((percent / 100) * fileShare));
}

export function getDownloadName(result: Pick<ProcessedFile, 'name' | 'outputFormat'>): string {
  const extension = outputExtension(result.outputFormat);
  if (!extension) {
    return result.name;
  }

  const extensionIndex = result.name.lastIndexOf('.');
  const baseName = extensionIndex > 0 ? result.name.slice(0, extensionIndex) : result.name;
  return `${baseName}${extension}`;
}

export function getSplitDownloadName(
  name: string,
  row: number,
  column: number,
  outputFormat: string,
): string {
  const extensionIndex = name.lastIndexOf('.');
  const baseName = extensionIndex > 0 ? name.slice(0, extensionIndex) : name;
  const extension = extensionIndex > 0
    ? name.slice(extensionIndex)
    : outputExtension(outputFormat) ?? '.png';

  return `${baseName}-r${row}-c${column}${extension}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function createZipBlob(entries: ZipEntry[]): Promise<Blob> {
  const parts: BlobPart[] = [];
  const centralDirectoryParts: Uint8Array[] = [];
  let offset = 0;
  const { date, time } = getZipDateTime();

  for (const entry of entries) {
    const bytes = new Uint8Array(await entry.blob.arrayBuffer());
    const nameBytes = new TextEncoder().encode(entry.name);
    const crc = crc32(bytes);
    const localHeader = new Uint8Array(30);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0x0800);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, time);
    writeUint16(localHeader, 12, date);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, bytes.length);
    writeUint32(localHeader, 22, bytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);

    parts.push(toArrayBuffer(localHeader), toArrayBuffer(nameBytes), entry.blob);

    const centralHeader = new Uint8Array(46);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0x0800);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, time);
    writeUint16(centralHeader, 14, date);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, bytes.length);
    writeUint32(centralHeader, 24, bytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralDirectoryParts.push(centralHeader, nameBytes);

    offset += localHeader.length + nameBytes.length + bytes.length;
  }

  const centralDirectoryOffset = offset;
  for (const part of centralDirectoryParts) {
    parts.push(toArrayBuffer(part));
    offset += part.length;
  }

  const centralDirectorySize = offset - centralDirectoryOffset;
  const endRecord = new Uint8Array(22);
  writeUint32(endRecord, 0, 0x06054b50);
  writeUint16(endRecord, 4, 0);
  writeUint16(endRecord, 6, 0);
  writeUint16(endRecord, 8, entries.length);
  writeUint16(endRecord, 10, entries.length);
  writeUint32(endRecord, 12, centralDirectorySize);
  writeUint32(endRecord, 16, centralDirectoryOffset);
  writeUint16(endRecord, 20, 0);
  parts.push(toArrayBuffer(endRecord));

  return new Blob(parts, { type: 'application/zip' });
}

export function uniqueZipEntries(results: ProcessedFile[]): ZipEntry[] {
  const usedNames = new Set<string>();

  return results.map((result) => {
    const baseName = sanitizeZipName(getDownloadName(result));
    const uniqueName = makeUniqueName(baseName, usedNames);
    usedNames.add(uniqueName.toLowerCase());

    return {
      name: uniqueName,
      blob: result.blob,
    };
  });
}

function formatDecimal(value: number): string {
  return Number(value.toFixed(1)).toString();
}

function outputExtension(outputFormat?: string): string | undefined {
  if (outputFormat === 'image/jpeg') return '.jpg';
  if (outputFormat === 'image/webp') return '.webp';
  if (outputFormat === 'image/png') return '.png';
  return undefined;
}

let crcTable: Uint32Array | undefined;

function getCrcTable(): Uint32Array {
  if (crcTable) {
    return crcTable;
  }

  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  crcTable = table;
  return table;
}

function crc32(bytes: Uint8Array): number {
  const table = getCrcTable();
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function getZipDateTime(): { date: number; time: number } {
  const now = new Date();
  const year = Math.max(1980, now.getFullYear());
  const date = ((year - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);

  return { date, time };
}

function sanitizeZipName(name: string): string {
  const sanitized = name.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
  return sanitized || 'localresizer-image';
}

function makeUniqueName(name: string, usedNames: Set<string>): string {
  if (!usedNames.has(name.toLowerCase())) {
    return name;
  }

  const extensionIndex = name.lastIndexOf('.');
  const base = extensionIndex > 0 ? name.slice(0, extensionIndex) : name;
  const extension = extensionIndex > 0 ? name.slice(extensionIndex) : '';
  let index = 2;

  while (usedNames.has(`${base}-${index}${extension}`.toLowerCase())) {
    index += 1;
  }

  return `${base}-${index}${extension}`;
}
