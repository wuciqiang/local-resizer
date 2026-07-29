import { useCallback, useEffect, useRef, useState } from 'react';
import {
  convertImage,
  getConversionDownloadName,
  type ConversionOutputType,
} from '../../lib/convert';
import {
  fileCountBucket,
  mimeFormat,
  sizeBucket,
  trackToolEvent,
} from '../../lib/analytics';
import { downloadBlob } from '../image-processor/utils';
import {
  ConverterValidationError,
  inspectConverterFile,
  qualityPercentToCanvas,
  type InspectedConverterFile,
} from './controller';
import type {
  ConverterResult,
  ConverterStatus,
  ImageConverterController,
} from './types';

interface UseImageConverterOptions {
  acceptedTypes: string[];
  createSelectedPreview?: boolean;
  maxFileSize: number;
  outputType: ConversionOutputType;
}

export function useImageConverter({
  acceptedTypes,
  createSelectedPreview = false,
  maxFileSize,
  outputType,
}: UseImageConverterOptions): ImageConverterController {
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<ImageConverterController['errorCode']>();
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState(92);
  const [result, setResult] = useState<ConverterResult>();
  const [selected, setSelected] = useState<InspectedConverterFile>();
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string>();
  const [status, setStatus] = useState<ConverterStatus>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const operationIdRef = useRef(0);
  const resultRef = useRef<ConverterResult | undefined>(undefined);
  const selectedPreviewUrlRef = useRef<string | undefined>(undefined);

  const replaceResult = useCallback((next?: ConverterResult) => {
    if (resultRef.current) {
      URL.revokeObjectURL(resultRef.current.url);
    }
    resultRef.current = next;
    setResult(next);
  }, []);

  const replaceSelected = useCallback((next?: InspectedConverterFile) => {
    if (selectedPreviewUrlRef.current) {
      URL.revokeObjectURL(selectedPreviewUrlRef.current);
    }

    const nextPreviewUrl = next && createSelectedPreview
      ? URL.createObjectURL(next.file)
      : undefined;
    selectedPreviewUrlRef.current = nextPreviewUrl;
    setSelectedPreviewUrl(nextPreviewUrl);
    setSelected(next);
  }, [createSelectedPreview]);

  useEffect(() => {
    return () => {
      operationIdRef.current += 1;
      if (resultRef.current) {
        URL.revokeObjectURL(resultRef.current.url);
      }
      if (selectedPreviewUrlRef.current) {
        URL.revokeObjectURL(selectedPreviewUrlRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    operationIdRef.current += 1;
    replaceResult();
    replaceSelected();
    setStatus('idle');
    setProgress(0);
    setError('');
    setErrorCode(undefined);
    setDragOver(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [replaceResult, replaceSelected]);

  const selectFiles = useCallback(async (incoming: FileList | File[]) => {
    if (status === 'processing') return;

    const files = Array.from(incoming);
    const operationId = operationIdRef.current + 1;
    operationIdRef.current = operationId;
    replaceResult();
    replaceSelected();
    setProgress(0);
    setError('');
    setErrorCode(undefined);

    if (files.length !== 1) {
      setStatus('error');
      setError('Select one static image at a time.');
      setErrorCode('multiple_files');
      return;
    }

    setStatus('validating');
    try {
      const inspected = await inspectConverterFile(files[0], {
        acceptedTypes,
        maxFileSize,
        outputType,
      });
      if (operationIdRef.current !== operationId) return;

      replaceSelected(inspected);
      setStatus('selected');
      trackToolEvent('upload_completed', {
        tool_action: 'convert',
        tool_mode: 'convert',
        result_type: 'input_validated',
        file_count: 1,
        file_count_bucket: fileCountBucket(1),
        input_format: mimeFormat(inspected.file.type),
        input_size_bucket: sizeBucket(inspected.file.size),
        output_format: mimeFormat(outputType),
      });
    } catch (validationError) {
      if (operationIdRef.current !== operationId) return;

      setStatus('error');
      setError(validationError instanceof Error
        ? validationError.message
        : 'This image could not be validated.');
      setErrorCode(validationError instanceof ConverterValidationError
        ? validationError.code
        : 'invalid_image');
    }
  }, [acceptedTypes, maxFileSize, outputType, replaceResult, replaceSelected, status]);

  const convertSelected = useCallback(async () => {
    if (!selected || status === 'processing') return;

    const operationId = operationIdRef.current + 1;
    operationIdRef.current = operationId;
    replaceResult();
    setStatus('processing');
    setProgress(15);
    setError('');
    setErrorCode(undefined);
    trackToolEvent('process_started', {
      tool_action: 'convert',
      tool_mode: 'convert',
      result_type: 'format_conversion',
      file_count: 1,
      file_count_bucket: fileCountBucket(1),
      input_format: mimeFormat(selected.file.type),
      input_size_bucket: sizeBucket(selected.file.size),
      output_format: mimeFormat(outputType),
    });

    try {
      const converted = await convertImage({
        backgroundColor,
        file: selected.file,
        outputType,
        quality: outputType === 'image/jpeg'
          ? qualityPercentToCanvas(quality)
          : undefined,
      });
      if (operationIdRef.current !== operationId) return;

      const nextResult: ConverterResult = {
        ...converted,
        downloadName: getConversionDownloadName(selected.file.name, outputType),
        originalSize: selected.file.size,
        outputSize: converted.blob.size,
        url: URL.createObjectURL(converted.blob),
      };
      replaceResult(nextResult);
      replaceSelected();
      setProgress(100);
      setStatus('done');

      const eventParams = {
        tool_action: 'convert',
        tool_mode: 'convert',
        result_type: 'format_conversion',
        file_count: 1,
        file_count_bucket: fileCountBucket(1),
        input_format: mimeFormat(selected.file.type),
        input_size_bucket: sizeBucket(selected.file.size),
        output_format: mimeFormat(converted.outputFormat),
      };
      trackToolEvent('tool_result_view', eventParams);
      trackToolEvent('process_completed', eventParams);
    } catch (processingError) {
      if (operationIdRef.current !== operationId) return;

      setStatus('error');
      setError(processingError instanceof Error
        ? processingError.message
        : 'Image conversion failed.');
      setErrorCode('processing_failed');
      trackToolEvent('process_failed', {
        tool_action: 'convert',
        tool_mode: 'convert',
        result_type: 'error',
        input_format: mimeFormat(selected.file.type),
        output_format: mimeFormat(outputType),
        error_type: 'processing_failed',
      });
    }
  }, [backgroundColor, outputType, quality, replaceResult, replaceSelected, selected, status]);

  const downloadResult = useCallback(() => {
    if (!result) return;

    trackToolEvent('download_result', {
      tool_action: 'convert',
      tool_mode: 'convert',
      result_type: 'single',
      output_format: mimeFormat(result.outputFormat),
    });
    downloadBlob(result.blob, result.downloadName);
  }, [result]);

  return {
    backgroundColor,
    convertSelected,
    downloadResult,
    dragOver,
    error,
    errorCode,
    inputRef,
    progress,
    quality,
    reset,
    result,
    selectFiles,
    selected,
    selectedPreviewUrl,
    setBackgroundColor,
    setDragOver,
    setQuality,
    status,
  };
}
