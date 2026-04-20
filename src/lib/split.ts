import { canvasToBlob, loadImage, resetCanvas } from './image/canvas';

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

export function getSplitRects(
  imageWidth: number,
  imageHeight: number,
  rows: number,
  columns: number,
): SplitRect[] {
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
