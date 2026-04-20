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

function getOutputType(fileType: string): string {
  if (fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/webp') {
    return fileType;
  }

  return 'image/png';
}

export async function splitImage({
  file,
  rows,
  columns,
}: SplitOptions): Promise<SplitPiece[]> {
  const image = await loadImage(file);
  const outputType = getOutputType(file.type);

  try {
    const pieceWidth = image.naturalWidth / columns;
    const pieceHeight = image.naturalHeight / rows;
    const pieces: SplitPiece[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const sourceX = Math.round(column * pieceWidth);
        const sourceY = Math.round(row * pieceHeight);
        const nextX = Math.round((column + 1) * pieceWidth);
        const nextY = Math.round((row + 1) * pieceHeight);
        const width = Math.max(1, nextX - sourceX);
        const height = Math.max(1, nextY - sourceY);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Canvas is not available in this browser.');
        }

        context.drawImage(
          image,
          sourceX,
          sourceY,
          width,
          height,
          0,
          0,
          width,
          height,
        );

        const blob = await canvasToBlob(canvas, outputType, outputType === 'image/png' ? 1 : 0.92);
        resetCanvas(canvas);

        pieces.push({
          blob,
          row: row + 1,
          column: column + 1,
          width,
          height,
          outputFormat: outputType,
        });
      }
    }

    return pieces;
  } finally {
    URL.revokeObjectURL(image.src);
  }
}
