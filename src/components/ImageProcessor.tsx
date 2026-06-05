import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfigPanel } from './image-processor/ConfigPanel';
import { MIME_LABELS } from './image-processor/presets';
import { ProgressPanel } from './image-processor/ProgressPanel';
import { ResultsPanel } from './image-processor/ResultsPanel';
import { SelectedFilesPanel } from './image-processor/SelectedFilesPanel';
import type {
  ImageProcessorProps,
  PngChoice,
  ProcessedFile,
  Status,
} from './image-processor/types';
import { UploadDropzone } from './image-processor/UploadDropzone';
import {
  fmtBytes,
  getBatchProgress,
  getDownloadName,
  getInitialSizeUnit,
  getInitialSizeValue,
  parseDimensions,
  parseTargetSize,
  readImageDimensions,
  revokeUrls,
  createZipBlob,
  downloadBlob,
  uniqueZipEntries,
} from './image-processor/utils';
import {
  fileCountBucket,
  fileFormatSummary,
  resultFormatSummary,
  sizeBucket,
  trackToolEvent,
} from '../lib/analytics';

export default function ImageProcessor({
  action,
  format,
  targetSizeBytes,
  defaultTargetSizeBytes,
  dimensions,
  defaultDimensions,
  acceptFormats,
  maxFileSize,
  lockedAction,
  hideActionTabs = false,
  resizeMode = 'fit',
  forceCanvasSize = false,
}: ImageProcessorProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [toolAction, setToolAction] = useState<'compress' | 'resize'>(lockedAction ?? action);
  const [pngChoice, setPngChoice] = useState<PngChoice>('none');
  const initialSizeBytes = targetSizeBytes ?? defaultTargetSizeBytes;
  const initialDimensions = dimensions ?? defaultDimensions;
  const [sizeValue, setSizeValue] = useState(() => getInitialSizeValue(initialSizeBytes));
  const [sizeUnit, setSizeUnit] = useState<'kb' | 'mb'>(() => getInitialSizeUnit(initialSizeBytes));
  const [widthValue, setWidthValue] = useState(() => initialDimensions?.width?.toString() ?? '1280');
  const [heightValue, setHeightValue] = useState(() => initialDimensions?.height?.toString() ?? '720');
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFixedTargetSize = typeof targetSizeBytes === 'number';
  const hasFixedDimensions = Boolean(dimensions);
  const canConfigureTargetSize = !hasFixedTargetSize && (lockedAction === 'compress' || (!lockedAction && !hasFixedDimensions));
  const canConfigureDimensions = !hasFixedDimensions && (lockedAction === 'resize' || (!lockedAction && !hasFixedTargetSize));
  const showConfigPanel = canConfigureTargetSize || canConfigureDimensions;

  useEffect(() => {
    setToolAction(lockedAction ?? action);
  }, [action, lockedAction]);

  useEffect(() => {
    return () => {
      revokeUrls(results);
    };
  }, [results]);

  const accept = acceptFormats.join(',');
  const acceptLabels = useMemo(
    () => Array.from(new Set(acceptFormats.map((type) => MIME_LABELS[type] ?? type))),
    [acceptFormats],
  );

  const effectiveAction = lockedAction ?? toolAction;
  const effectiveTargetSizeBytes = useMemo(() => {
    if (hasFixedTargetSize) {
      return targetSizeBytes;
    }

    if (effectiveAction !== 'compress' || !canConfigureTargetSize) {
      return undefined;
    }

    return parseTargetSize(sizeValue, sizeUnit);
  }, [
    canConfigureTargetSize,
    effectiveAction,
    hasFixedTargetSize,
    sizeUnit,
    sizeValue,
    targetSizeBytes,
  ]);

  const effectiveDimensions = useMemo(() => {
    if (hasFixedDimensions) {
      return dimensions;
    }

    if (effectiveAction !== 'resize' || !canConfigureDimensions) {
      return undefined;
    }

    return parseDimensions(widthValue, heightValue);
  }, [
    canConfigureDimensions,
    dimensions,
    effectiveAction,
    hasFixedDimensions,
    heightValue,
    widthValue,
  ]);

  const processorHint = useMemo(() => {
    if (effectiveTargetSizeBytes) {
      return `Target file size: ${fmtBytes(effectiveTargetSizeBytes)}.`;
    }

    if (effectiveAction === 'resize' && effectiveDimensions) {
      const base = `Output size: ${effectiveDimensions.width} x ${effectiveDimensions.height}px.`;
      if (forceCanvasSize) {
        return `${base} The output canvas is exact and keeps the whole image visible.`;
      }

      return `${base} The image keeps its original aspect ratio.`;
    }

    return 'Choose a file-size target or dimensions before processing.';
  }, [effectiveAction, effectiveDimensions, effectiveTargetSizeBytes, forceCanvasSize]);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const incomingFiles = Array.from(incoming);
    if (incomingFiles.length === 0) {
      return;
    }

    if (incomingFiles.length > 20) {
      setError('You can process up to 20 static images at a time.');
      return;
    }

    const valid: File[] = [];
    for (const file of incomingFiles) {
      if (!acceptFormats.includes(file.type)) {
        setError(`Unsupported file type for this page: ${file.name}.`);
        return;
      }

      if (file.size > maxFileSize) {
        setError(`${file.name} exceeds the ${fmtBytes(maxFileSize)} limit.`);
        return;
      }

      valid.push(file);
    }

    revokeUrls(results);
    setFiles(valid);
    setResults([]);
    setStatus('idle');
    setError('');
    setPngChoice(valid.some((file) => file.type === 'image/png') ? 'pending' : 'none');
    trackToolEvent('upload_completed', {
      tool_action: 'select_files',
      tool_mode: effectiveAction,
      file_count: valid.length,
      file_count_bucket: fileCountBucket(valid.length),
      input_format: fileFormatSummary(valid),
      input_size_bucket: sizeBucket(valid.reduce((sum, file) => sum + file.size, 0)),
    });
  }, [acceptFormats, effectiveAction, maxFileSize, results]);

  const processFiles = useCallback(async () => {
    if (files.length === 0) {
      return;
    }

    if (effectiveAction === 'compress' && !effectiveTargetSizeBytes) {
      setError('Enter a valid file-size target before processing.');
      return;
    }

    if (pngChoice === 'pending' && effectiveTargetSizeBytes) {
      setError('Please choose a PNG compression strategy below before processing.');
      return;
    }

    if (effectiveAction === 'resize' && !effectiveDimensions && !effectiveTargetSizeBytes) {
      setError('Enter valid width and height values before processing.');
      return;
    }

    setStatus('processing');
    setProgress(0);
    setError('');
    trackToolEvent('process_started', {
      tool_action: effectiveAction,
      tool_mode: effectiveAction,
      file_count: files.length,
      file_count_bucket: fileCountBucket(files.length),
      input_format: fileFormatSummary(files),
      output_format: format ?? (effectiveAction === 'compress' ? 'auto' : 'original'),
      result_type: effectiveTargetSizeBytes ? 'target_size' : effectiveDimensions ? 'dimensions' : 'original',
      target_size_bucket: effectiveTargetSizeBytes ? sizeBucket(effectiveTargetSizeBytes) : undefined,
    });
    const processed: ProcessedFile[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        let blob: Blob;
        let width = 0;
        let height = 0;
        let originalWidth = 0;
        let originalHeight = 0;
        let note: string | undefined;
        let outputFormat: string | undefined;

        if (effectiveAction === 'resize' && effectiveDimensions) {
          const { resizeImage } = await import('../lib/resize');
          const result = await resizeImage({
            file,
            targetDimensions: effectiveDimensions,
            resizeMode,
            forceCanvasSize,
          });
          blob = result.blob;
          width = result.width;
          height = result.height;
          originalWidth = result.originalWidth;
          originalHeight = result.originalHeight;
          note = result.note;
        } else if (effectiveTargetSizeBytes) {
          const { compressImage } = await import('../lib/compress');
          const strategy = file.type === 'image/png' && pngChoice !== 'none'
            ? pngChoice as 'webp' | 'png-scale'
            : 'auto';

          const result = await compressImage({
            file,
            targetSizeBytes: effectiveTargetSizeBytes,
            format: format ? `image/${format}` : undefined,
            pngStrategy: strategy,
            onProgress: (percent) => {
              setProgress(getBatchProgress(index, files.length, percent));
            },
          });
          blob = result.blob;
          width = result.width;
          height = result.height;
          originalWidth = result.originalWidth;
          originalHeight = result.originalHeight;
          note = result.note;
          outputFormat = result.outputFormat;
        } else {
          blob = file;
          const fallbackDimensions = await readImageDimensions(file);
          width = fallbackDimensions.width;
          height = fallbackDimensions.height;
          originalWidth = fallbackDimensions.width;
          originalHeight = fallbackDimensions.height;
          note = 'No processing settings were applied, so the original file was kept.';
        }

        processed.push({
          name: file.name,
          originalSize: file.size,
          processedSize: blob.size,
          url: URL.createObjectURL(blob),
          blob,
          width,
          height,
          originalWidth,
          originalHeight,
          note,
          outputFormat,
        });
        setProgress(Math.round(((index + 1) / files.length) * 100));
      }

      setResults(processed);
      setStatus('done');
      trackToolEvent('tool_result_view', {
        tool_action: effectiveAction,
        tool_mode: effectiveAction,
        result_type: 'processed',
        file_count: processed.length,
        file_count_bucket: fileCountBucket(processed.length),
        input_format: fileFormatSummary(files),
        output_format: resultFormatSummary(processed),
      });
      trackToolEvent('process_completed', {
        tool_action: effectiveAction,
        tool_mode: effectiveAction,
        result_type: 'processed',
        file_count: processed.length,
        file_count_bucket: fileCountBucket(processed.length),
        input_format: fileFormatSummary(files),
        output_format: resultFormatSummary(processed),
      });
    } catch (processingError) {
      revokeUrls(processed);
      setError(processingError instanceof Error ? processingError.message : 'Processing failed.');
      setStatus('error');
      trackToolEvent('process_failed', {
        tool_action: effectiveAction,
        tool_mode: effectiveAction,
        result_type: 'error',
        error_type: 'processing_failed',
      });
    }
  }, [
    effectiveAction,
    effectiveDimensions,
    effectiveTargetSizeBytes,
    files,
    forceCanvasSize,
    format,
    pngChoice,
    resizeMode,
  ]);

  const downloadFile = useCallback((result: ProcessedFile) => {
    trackToolEvent('download_result', {
      tool_action: effectiveAction,
      tool_mode: effectiveAction,
      result_type: 'single',
      output_format: resultFormatSummary([result]),
    });
    downloadBlob(result.blob, getDownloadName(result));
  }, [effectiveAction]);

  const downloadAllFiles = useCallback(async () => {
    if (results.length === 0) {
      return;
    }

    try {
      const zipBlob = await createZipBlob(uniqueZipEntries(results));
      trackToolEvent('download_result', {
        tool_action: effectiveAction,
        tool_mode: effectiveAction,
        result_type: 'batch_zip',
        file_count: results.length,
        file_count_bucket: fileCountBucket(results.length),
        output_format: resultFormatSummary(results),
      });
      downloadBlob(zipBlob, 'localresizer-results.zip');
    } catch (zipError) {
      setError(zipError instanceof Error ? zipError.message : 'Preparing the ZIP download failed.');
    }
  }, [effectiveAction, results]);

  const reset = useCallback(() => {
    revokeUrls(results);
    setFiles([]);
    setResults([]);
    setStatus('idle');
    setProgress(0);
    setError('');
    setPngChoice('none');
  }, [results]);

  return (
    <section className="max-w-2xl mx-auto px-5 py-6">
      {status !== 'done' && (
        <UploadDropzone
          accept={accept}
          acceptLabels={acceptLabels}
          dragOver={dragOver}
          inputRef={inputRef}
          showConfigPanel={showConfigPanel}
          maxFileSizeLabel={fmtBytes(maxFileSize)}
          processorHint={processorHint}
          onDragStateChange={setDragOver}
          onFilesSelected={handleFiles}
        />
      )}

      {showConfigPanel && (
        <ConfigPanel
          hideActionTabs={hideActionTabs || Boolean(lockedAction)}
          heightValue={heightValue}
          processorHint={processorHint}
          sizeUnit={sizeUnit}
          sizeValue={sizeValue}
          showResizeControls={canConfigureDimensions}
          showSizeControls={canConfigureTargetSize}
          toolAction={toolAction}
          widthValue={widthValue}
          onHeightChange={setHeightValue}
          onSizeUnitChange={setSizeUnit}
          onSizeValueChange={setSizeValue}
          onToolActionChange={(nextAction) => {
            trackToolEvent('tool_option_select', {
              tool_action: 'mode_select',
              option_group: 'tool_mode',
              option_value: nextAction,
            });
            setToolAction(nextAction);
          }}
          onWidthChange={setWidthValue}
        />
      )}

      {files.length > 0 && status !== 'done' && (
        <SelectedFilesPanel
          effectiveAction={effectiveAction}
          effectiveTargetSizeBytes={effectiveTargetSizeBytes}
          files={files}
          pngChoice={pngChoice}
          onPngChoiceChange={(nextChoice) => {
            trackToolEvent('tool_option_select', {
              tool_action: 'png_strategy_select',
              tool_mode: effectiveAction,
              option_group: 'png_strategy',
              option_value: nextChoice,
            });
            setPngChoice(nextChoice);
          }}
          onProcess={processFiles}
          onReset={reset}
        />
      )}

      {status === 'processing' && <ProgressPanel progress={progress} />}

      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 animate-fade-up">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {status === 'done' && results.length > 0 && (
        <ResultsPanel
          results={results}
          onDownload={downloadFile}
          onDownloadAll={downloadAllFiles}
          onReset={reset}
        />
      )}
    </section>
  );
}
