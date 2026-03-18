import type { ResizeMode } from '../../data/routes';

export interface ImageProcessorProps {
  action: 'compress' | 'resize';
  format?: string;
  targetSizeBytes?: number;
  dimensions?: { width: number; height: number };
  acceptFormats: string[];
  maxFileSize: number;
  resizeMode?: ResizeMode;
  forceCanvasSize?: boolean;
}

export interface ProcessedFile {
  name: string;
  originalSize: number;
  processedSize: number;
  url: string;
  blob: Blob;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  note?: string;
  outputFormat?: string;
}

export interface QuickSizePreset {
  label: string;
  value: string;
  unit: 'kb' | 'mb';
}

export interface QuickDimensionPreset {
  label: string;
  width: number;
  height: number;
}

export type Status = 'idle' | 'processing' | 'done' | 'error';
export type PngChoice = 'pending' | 'webp' | 'png-scale' | 'none';
