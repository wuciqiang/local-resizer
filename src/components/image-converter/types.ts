import type { RefObject } from 'react';
import type { ConversionOutputType } from '../../lib/convert';
import type {
  ConverterValidationCode,
  InspectedConverterFile,
} from './controller';

export type ConverterStatus =
  | 'idle'
  | 'validating'
  | 'selected'
  | 'processing'
  | 'done'
  | 'error';

export interface ConverterResult {
  blob: Blob;
  downloadName: string;
  height: number;
  inputFormat: string;
  originalSize: number;
  outputFormat: ConversionOutputType;
  outputSize: number;
  url: string;
  width: number;
}

export interface ImageConverterProcessorProps {
  acceptedTypes: string[];
  maxFileSize?: number;
  outputType: ConversionOutputType;
  showBackground?: boolean;
  showQuality?: boolean;
}

export interface ImageConverterController {
  backgroundColor: string;
  convertSelected: () => Promise<void>;
  downloadResult: () => void;
  dragOver: boolean;
  error: string;
  errorCode?: ConverterValidationCode | 'multiple_files' | 'processing_failed';
  inputRef: RefObject<HTMLInputElement | null>;
  progress: number;
  quality: number;
  reset: () => void;
  result?: ConverterResult;
  selectFiles: (files: FileList | File[]) => Promise<void>;
  selected?: InspectedConverterFile;
  selectedPreviewUrl?: string;
  setBackgroundColor: (value: string) => void;
  setDragOver: (value: boolean) => void;
  setQuality: (value: number) => void;
  status: ConverterStatus;
}
