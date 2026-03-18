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
} from './image-processor/utils';

export default function ImageProcessor({
  action,
  format,
  targetSizeBytes,
  dimensions,
  acceptFormats,
  maxFileSize,
  resizeMode = 'fit',
  forceCanvasSize = false,
}: ImageProcessorProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [toolAction, setToolAction] = useState<'compress' | 'resize'>(action);
  const [pngChoice, setPngChoice] = useState<PngChoice>('none');
  const [sizeValue, setSizeValue] = useState(() => getInitialSizeValue(targetSizeBytes));
  const [sizeUnit, setSizeUnit] = useState<'kb' | 'mb'>(() => getInitialSizeUnit(targetSizeBytes));
  const [widthValue, setWidthValue] = useState(() => dimensions?.width?.toString() ?? '1280');
  const [heightValue, setHeightValue] = useState(() => dimensions?.height?.toString() ?? '720');
  const inputRef = useRef<HTMLInputElement>(null);
  const isConfigurable = !targetSizeBytes && !dimensions;

  useEffect(() => {
    setToolAction(action);
  }, [action]);

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

  const effectiveAction = isConfigurable ? toolAction : action;
  const effectiveTargetSizeBytes = useMemo(() => {
    if (!isConfigurable) {
      return targetSizeBytes;
    }

    if (toolAction !== 'compress') {
      return undefined;
    }

    return parseTargetSize(sizeValue, sizeUnit);
  }, [isConfigurable, sizeUnit, sizeValue, targetSizeBytes, toolAction]);

  const effectiveDimensions = useMemo(() => {
    if (!isConfigurable) {
      return dimensions;
    }

    if (toolAction !== 'resize') {
      return undefined;
    }

    return parseDimensions(widthValue, heightValue);
  }, [dimensions, heightValue, isConfigurable, toolAction, widthValue]);

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
  }, [acceptFormats, maxFileSize, results]);

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
            resizeMode: isConfigurable ? 'cover' : resizeMode,
            forceCanvasSize: isConfigurable ? true : forceCanvasSize,
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
    } catch (processingError) {
      revokeUrls(processed);
      setError(processingError instanceof Error ? processingError.message : 'Processing failed.');
      setStatus('error');
    }
  }, [
    effectiveAction,
    effectiveDimensions,
    effectiveTargetSizeBytes,
    files,
    forceCanvasSize,
    format,
    isConfigurable,
    pngChoice,
    resizeMode,
  ]);

  const downloadFile = useCallback((result: ProcessedFile) => {
    const anchor = document.createElement('a');
    anchor.href = result.url;
    anchor.download = getDownloadName(result);
    anchor.click();
  }, []);

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
          isConfigurable={isConfigurable}
          maxFileSizeLabel={fmtBytes(maxFileSize)}
          processorHint={processorHint}
          onDragStateChange={setDragOver}
          onFilesSelected={handleFiles}
        />
      )}

      {isConfigurable && (
        <ConfigPanel
          heightValue={heightValue}
          processorHint={processorHint}
          sizeUnit={sizeUnit}
          sizeValue={sizeValue}
          toolAction={toolAction}
          widthValue={widthValue}
          onHeightChange={setHeightValue}
          onSizeUnitChange={setSizeUnit}
          onSizeValueChange={setSizeValue}
          onToolActionChange={setToolAction}
          onWidthChange={setWidthValue}
        />
      )}

      {files.length > 0 && status !== 'done' && (
        <SelectedFilesPanel
          effectiveAction={effectiveAction}
          effectiveTargetSizeBytes={effectiveTargetSizeBytes}
          files={files}
          pngChoice={pngChoice}
          onPngChoiceChange={setPngChoice}
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
          onReset={reset}
        />
      )}
    </section>
  );
}
