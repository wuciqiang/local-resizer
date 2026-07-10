import { canvasToBlob, loadImage, resetCanvas } from './image/canvas';
import { assertCanvasDimensions } from './image/limits';

export const MAX_SPLIT_AXIS = 20;
export const MAX_SPLIT_PIECES = 100;

export interface SplitOptions {
  file: File;
  rows: number;
  columns: number;
}

export interface SplitPiece {
  blob: Blob;
  row: number;
  column: number;
  width: number;
  height: number;
  outputFormat: string;
}

export interface SplitRect {
  row: number;
  column: number;
  sourceX: number;
  sourceY: number;
  width: number;
  height: number;
}

function getOutputType(fileType: string): string {
  if (fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/webp') {
    return fileType;
  }

  return 'image/png';
}

export function getSplitGridError(
  imageWidth: number,
  imageHeight: number,
  rows: number,
  columns: number,
): string | undefined {
  if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(columns) || columns < 1) {
    return 'Enter whole-number row and column counts of at least 1.';
  }

  if (rows > MAX_SPLIT_AXIS || columns > MAX_SPLIT_AXIS) {
    return `Use no more than ${MAX_SPLIT_AXIS} rows or columns.`;
  }

  if (rows * columns > MAX_SPLIT_PIECES) {
    return `Use no more than ${MAX_SPLIT_PIECES} total grid pieces.`;
  }

  if (rows > imageHeight) {
    return `Rows cannot exceed the source image height of ${imageHeight}px.`;
  }

  if (columns > imageWidth) {
    return `Columns cannot exceed the source image width of ${imageWidth}px.`;
  }

  return undefined;
}

export function getSplitRects(
  imageWidth: number,
  imageHeight: number,
  rows: number,
  columns: number,
): SplitRect[] {
  const gridError = getSplitGridError(imageWidth, imageHeight, rows, columns);
  if (gridError) {
    throw new Error(gridError);
  }

  const pieceWidth = imageWidth / columns;
  const pieceHeight = imageHeight / rows;
  const rects: SplitRect[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const sourceX = Math.round(column * pieceWidth);
      const sourceY = Math.round(row * pieceHeight);
      const nextX = Math.round((column + 1) * pieceWidth);
      const nextY = Math.round((row + 1) * pieceHeight);
      rects.push({
        row: row + 1,
        column: column + 1,
        sourceX,
        sourceY,
        width: Math.max(1, nextX - sourceX),
        height: Math.max(1, nextY - sourceY),
      });
    }
  }

  return rects;
}

export async function splitImage({
  file,
  rows,
  columns,
}: SplitOptions): Promise<SplitPiece[]> {
  const image = await loadImage(file);
  const outputType = getOutputType(file.type);

  try {
    const pieces: SplitPiece[] = [];
    const rects = getSplitRects(image.naturalWidth, image.naturalHeight, rows, columns);

    for (const rect of rects) {
      assertCanvasDimensions(rect.width, rect.height);
      const canvas = document.createElement('canvas');
      canvas.width = rect.width;
      canvas.height = rect.height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas is not available in this browser.');
      }

      context.drawImage(
        image,
        rect.sourceX,
        rect.sourceY,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height,
      );

      const blob = await canvasToBlob(canvas, outputType, outputType === 'image/png' ? 1 : 0.92);
      resetCanvas(canvas);

      pieces.push({
        blob,
        row: rect.row,
        column: rect.column,
        width: rect.width,
        height: rect.height,
        outputFormat: outputType,
      });
    }

    return pieces;
  } finally {
    URL.revokeObjectURL(image.src);
  }
}
