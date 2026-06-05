import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProgressPanel } from './image-processor/ProgressPanel';
import { ResultsPanel } from './image-processor/ResultsPanel';
import { UploadDropzone } from './image-processor/UploadDropzone';
import type { ProcessedFile, Status } from './image-processor/types';
import { fmtBytes, getDownloadName, parseDimensions, parseTargetSize, revokeUrls } from './image-processor/utils';
import { fileCountBucket, mimeFormat, resultFormatSummary, sizeBucket, trackToolEvent } from '../lib/analytics';

interface SignatureProcessorProps {
  acceptFormats: string[];
  defaultDimensions: { width: number; height: number };
  defaultTargetSizeBytes: number;
  maxFileSize: number;
}

type OutputMode = 'png' | 'jpeg';

interface TrimPreviewState {
  blob: Blob;
  originalUrl: string;
  trimmedUrl: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export default function SignatureProcessor({
  acceptFormats,
  defaultDimensions,
  defaultTargetSizeBytes,
  maxFileSize,
}: SignatureProcessorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessedFile | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [outputMode, setOutputMode] = useState<OutputMode>('png');
  const [widthValue, setWidthValue] = useState(String(defaultDimensions.width));
  const [heightValue, setHeightValue] = useState(String(defaultDimensions.height));
  const [sizeValue, setSizeValue] = useState(String(Math.round(defaultTargetSizeBytes / 1024)));
  const [trimPreview, setTrimPreview] = useState<TrimPreviewState | null>(null);
  const previewRequestRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (result) {
        revokeUrls([result]);
      }
      if (trimPreview) {
        URL.revokeObjectURL(trimPreview.originalUrl);
        URL.revokeObjectURL(trimPreview.trimmedUrl);
      }
    };
  }, [result, trimPreview]);

  const clearTrimPreview = useCallback(() => {
    setTrimPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current.originalUrl);
        URL.revokeObjectURL(current.trimmedUrl);
      }
      return null;
    });
  }, []);

  const processorHint = useMemo(() => {
    return `Trim extra whitespace, resize the signature to ${widthValue} x ${heightValue}px, and export as ${outputMode.toUpperCase()}.`;
  }, [heightValue, outputMode, widthValue]);

  const buildTrimPreview = useCallback(async (sourceFile: File) => {
    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    const { detectTrimBounds } = await import('../lib/image/trim');
    const bounds = await detectTrimBounds({ file: sourceFile });
    clearTrimPreview();

    if (!bounds) {
      return null;
    }

    const image = new Image();
    const originalUrl = URL.createObjectURL(sourceFile);
    image.src = originalUrl;

    try {
      await image.decode();

      if (
        bounds.left === 0 &&
        bounds.top === 0 &&
        bounds.width === image.naturalWidth &&
        bounds.height === image.naturalHeight
      ) {
        URL.revokeObjectURL(originalUrl);
        return null;
      }

      const canvas = document.createElement('canvas');
      canvas.width = bounds.width;
      canvas.height = bounds.height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas is not available in this browser.');
      }

      context.drawImage(
        image,
        bounds.left,
        bounds.top,
        bounds.width,
        bounds.height,
        0,
        0,
        bounds.width,
        bounds.height,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((createdBlob) => {
          if (createdBlob) {
            resolve(createdBlob);
            return;
          }
          reject(new Error('Failed to trim the signature image.'));
        }, 'image/png', 1);
      });

      const preview: TrimPreviewState = {
        blob,
        originalUrl,
        trimmedUrl: URL.createObjectURL(blob),
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
      if (requestId !== previewRequestRef.current) {
        URL.revokeObjectURL(preview.originalUrl);
        URL.revokeObjectURL(preview.trimmedUrl);
        return null;
      }
      setTrimPreview(preview);
      return { preview, blob };
    } catch (error) {
      URL.revokeObjectURL(originalUrl);
      throw error;
    }
  }, [clearTrimPreview]);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const nextFile = Array.from(incoming)[0];
    if (!nextFile) {
      return;
    }

    if (!acceptFormats.includes(nextFile.type)) {
      setError(`Unsupported file type for this page: ${nextFile.name}.`);
      return;
    }

    if (nextFile.size > maxFileSize) {
      setError(`${nextFile.name} exceeds the ${fmtBytes(maxFileSize)} limit.`);
      return;
    }

    clearTrimPreview();

    if (result) {
      revokeUrls([result]);
    }

    setFile(nextFile);
    setResult(null);
    setStatus('idle');
    setError('');
    trackToolEvent('upload_completed', {
      tool_action: 'select_files',
      tool_mode: 'signature',
      file_count: 1,
      file_count_bucket: fileCountBucket(1),
      input_format: mimeFormat(nextFile.type),
      input_size_bucket: sizeBucket(nextFile.size),
    });
    if (trimWhitespace) {
      void buildTrimPreview(nextFile).catch((previewError) => {
        setError(previewError instanceof Error ? previewError.message : 'Failed to prepare trim preview.');
      });
    }
  }, [acceptFormats, buildTrimPreview, clearTrimPreview, maxFileSize, result, trimWhitespace]);

  const refreshTrimPreview = useCallback(async () => {
    if (!file || !trimWhitespace) {
      clearTrimPreview();
      return;
    }

    const previewResult = await buildTrimPreview(file);
    if (!previewResult) {
      setError('');
    }
  }, [buildTrimPreview, clearTrimPreview, file, trimWhitespace]);

  const handleProcess = useCallback(async () => {
    if (!file) {
      return;
    }

    const targetDimensions = parseDimensions(widthValue, heightValue);
    const targetSizeBytes = parseTargetSize(sizeValue, 'kb');

    if (!targetDimensions) {
      setError('Enter valid width and height values before processing.');
      return;
    }

    if (!targetSizeBytes) {
      setError('Enter a valid target file size before processing.');
      return;
    }

    setStatus('processing');
    setProgress(10);
    setError('');
    trackToolEvent('process_started', {
      tool_action: 'signature',
      tool_mode: 'signature',
      file_count: 1,
      file_count_bucket: fileCountBucket(1),
      input_format: mimeFormat(file.type),
      output_format: outputMode,
      result_type: trimWhitespace ? 'trim_resize_compress' : 'resize_compress',
      target_size_bucket: sizeBucket(targetSizeBytes),
    });

    try {
      const { resizeImage } = await import('../lib/resize');
      const { compressImage } = await import('../lib/compress');

      let workingFile = file;
      let noteParts: string[] = [];

      if (trimWhitespace) {
        const previewResult = trimPreview ? null : await buildTrimPreview(file);
        const trimmedBlob = previewResult?.blob ?? trimPreview?.blob ?? null;
        if (trimmedBlob) {
          workingFile = new File([trimmedBlob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
          noteParts.push('Trimmed extra whitespace around the signature.');
        }
      }

      setProgress(40);

      const resized = await resizeImage({
        file: workingFile,
        targetDimensions,
        resizeMode: 'contain',
        forceCanvasSize: true,
        backgroundColor: outputMode === 'jpeg' ? '#ffffff' : 'transparent',
      });

      const resizedFile = new File(
        [resized.blob],
        outputMode === 'jpeg'
          ? file.name.replace(/\.[^.]+$/, '.jpg')
          : file.name.replace(/\.[^.]+$/, '.png'),
        { type: outputMode === 'jpeg' ? 'image/jpeg' : 'image/png' },
      );

      setProgress(70);

      const compressed = outputMode === 'png'
        ? resizedFile.size <= targetSizeBytes
          ? {
            blob: resizedFile,
            width: resized.width,
            height: resized.height,
            originalWidth: resized.originalWidth,
            originalHeight: resized.originalHeight,
            note: 'Kept the exact PNG dimensions because the resized signature already fit the requested size budget.',
          }
          : {
            blob: resized.blob,
            width: resized.width,
            height: resized.height,
            originalWidth: resized.originalWidth,
            originalHeight: resized.originalHeight,
            note: 'Kept the exact PNG dimensions. Lower the output dimensions or switch to JPG if you need a smaller file.',
          }
        : await compressImage({
          file: resizedFile,
          targetSizeBytes,
          format: 'image/jpeg',
          pngStrategy: 'auto',
        });

      setProgress(100);

      const outputFormat = outputMode === 'jpeg' ? 'image/jpeg' : 'image/png';
      const processed: ProcessedFile = {
        name: outputMode === 'jpeg'
          ? file.name.replace(/\.[^.]+$/, '.jpg')
          : file.name.replace(/\.[^.]+$/, '.png'),
        originalSize: file.size,
        processedSize: compressed.blob.size,
        url: URL.createObjectURL(compressed.blob),
        blob: compressed.blob,
        width: compressed.width,
        height: compressed.height,
        originalWidth: resized.originalWidth,
        originalHeight: resized.originalHeight,
        note: [...noteParts, compressed.note].filter(Boolean).join(' '),
        outputFormat,
      };

      setResult(processed);
      setStatus('done');
      trackToolEvent('tool_result_view', {
        tool_action: 'signature',
        tool_mode: 'signature',
        result_type: 'processed',
        file_count: 1,
        file_count_bucket: fileCountBucket(1),
        input_format: mimeFormat(file.type),
        output_format: resultFormatSummary([processed]),
      });
      trackToolEvent('process_completed', {
        tool_action: 'signature',
        tool_mode: 'signature',
        result_type: 'processed',
        file_count: 1,
        file_count_bucket: fileCountBucket(1),
        input_format: mimeFormat(file.type),
        output_format: resultFormatSummary([processed]),
      });
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Signature processing failed.');
      setStatus('error');
      trackToolEvent('process_failed', {
        tool_action: 'signature',
        tool_mode: 'signature',
        result_type: 'error',
        error_type: 'signature_processing_failed',
      });
    }
  }, [buildTrimPreview, file, heightValue, outputMode, sizeValue, trimPreview, trimWhitespace, widthValue]);

  const handleReset = useCallback(() => {
    clearTrimPreview();
    if (result) {
      revokeUrls([result]);
    }
    setFile(null);
    setResult(null);
    setStatus('idle');
    setProgress(0);
    setError('');
  }, [clearTrimPreview, result]);

  const handleDownload = useCallback((processed: ProcessedFile) => {
    trackToolEvent('download_result', {
      tool_action: 'signature',
      tool_mode: 'signature',
      result_type: 'single',
      output_format: resultFormatSummary([processed]),
    });
    const anchor = document.createElement('a');
    anchor.href = processed.url;
    anchor.download = getDownloadName(processed);
    anchor.click();
  }, []);

  return (
    <section className="max-w-3xl mx-auto px-5 py-6">
      {status !== 'done' && (
        <UploadDropzone
          accept={acceptFormats.join(',')}
          acceptLabels={['JPEG', 'PNG', 'WebP']}
          dragOver={dragOver}
          inputRef={inputRef}
          showConfigPanel
          maxFileSizeLabel={fmtBytes(maxFileSize)}
          processorHint={processorHint}
          multiple={false}
          fileCountLabel="1 signature image only"
          onDragStateChange={setDragOver}
          onFilesSelected={handleFiles}
        />
      )}

      {status !== 'done' && (
        <div className="mt-5 bg-white rounded-2xl border border-stone-200 shadow-soft p-5 animate-fade-up space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-stone-700">
              <span className="block font-medium mb-2">Width (px)</span>
              <input
                type="number"
                min="1"
                value={widthValue}
                onChange={(event) => setWidthValue(event.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </label>
            <label className="text-sm text-stone-700">
              <span className="block font-medium mb-2">Height (px)</span>
              <input
                type="number"
                min="1"
                value={heightValue}
                onChange={(event) => setHeightValue(event.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </label>
          </div>

          <label className="text-sm text-stone-700">
            <span className="block font-medium mb-2">Target file size (KB)</span>
            <input
              type="number"
              min="1"
              value={sizeValue}
              onChange={(event) => setSizeValue(event.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={trimWhitespace}
                onChange={async (event) => {
                  const nextValue = event.target.checked;
                  trackToolEvent('tool_option_select', {
                    tool_action: 'trim_toggle',
                    tool_mode: 'signature',
                    option_group: 'trim_whitespace',
                    option_value: nextValue ? 'enabled' : 'disabled',
                  });
                  setTrimWhitespace(nextValue);

                  if (!nextValue) {
                    clearTrimPreview();
                    return;
                  }

                  if (!file) {
                    return;
                  }

                  try {
                    await refreshTrimPreview();
                    setError('');
                  } catch (previewError) {
                    setError(previewError instanceof Error ? previewError.message : 'Failed to refresh trim preview.');
                  }
                }}
              />
              Automatically trim extra whitespace
            </label>

            <label className="text-sm text-stone-700">
              <span className="block font-medium mb-2">Output format</span>
              <select
                value={outputMode}
                onChange={(event) => {
                  const nextMode = event.target.value as OutputMode;
                  trackToolEvent('tool_option_select', {
                    tool_action: 'output_format_select',
                    tool_mode: 'signature',
                    option_group: 'output_format',
                    option_value: nextMode,
                  });
                  setOutputMode(nextMode);
                }}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
              >
                <option value="png">Transparent PNG</option>
                <option value="jpeg">White background JPG</option>
              </select>
            </label>
          </div>

          <p className="text-xs text-stone-500">{processorHint}</p>
        </div>
      )}

      {file && status !== 'done' && trimWhitespace && (
        <div className="mt-4 bg-white rounded-2xl border border-stone-200 shadow-soft p-5 animate-fade-up space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-800">Trim preview</p>
              <p className="text-xs text-stone-500 mt-1">Review the automatic whitespace crop before export, or turn trimming off.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await refreshTrimPreview();
                    setError('');
                  } catch (previewError) {
                    setError(previewError instanceof Error ? previewError.message : 'Failed to refresh trim preview.');
                  }
                }}
                className="px-3 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm"
              >
                Refresh Preview
              </button>
              {trimPreview && (
                <button
                  type="button"
                  onClick={() => {
                    trackToolEvent('tool_option_select', {
                      tool_action: 'trim_toggle',
                      tool_mode: 'signature',
                      option_group: 'trim_whitespace',
                      option_value: 'disabled',
                    });
                    setTrimWhitespace(false);
                    clearTrimPreview();
                  }}
                  className="px-3 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm"
                >
                  Disable Trim
                </button>
              )}
            </div>
          </div>

          {trimPreview ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <figure className="space-y-2">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 min-h-[180px] flex items-center justify-center overflow-hidden">
                    <img src={trimPreview.originalUrl} alt="Original signature preview" className="max-h-56 w-auto object-contain" />
                  </div>
                  <figcaption className="text-xs text-stone-500">Original upload</figcaption>
                </figure>
                <figure className="space-y-2">
                  <div className="rounded-xl border border-stone-200 bg-[linear-gradient(45deg,#f5f5f4_25%,transparent_25%,transparent_75%,#f5f5f4_75%),linear-gradient(45deg,#f5f5f4_25%,transparent_25%,transparent_75%,#f5f5f4_75%)] [background-size:16px_16px] [background-position:0_0,8px_8px] p-4 min-h-[180px] flex items-center justify-center overflow-hidden">
                    <img src={trimPreview.trimmedUrl} alt="Trimmed signature preview" className="max-h-56 w-auto object-contain" />
                  </div>
                  <figcaption className="text-xs text-stone-500">
                    Trimmed area: {trimPreview.width} x {trimPreview.height}px from ({trimPreview.left}, {trimPreview.top})
                  </figcaption>
                </figure>
              </div>
              <p className="text-xs text-stone-500">
                Final export will still resize to {widthValue} x {heightValue}px and then apply the selected output format.
              </p>
            </>
          ) : (
            <p className="text-sm text-stone-600 rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-3">
              No extra outer whitespace was detected yet. You can still export without trimming or refresh the preview after changing the image.
            </p>
          )}
        </div>
      )}

      {file && status !== 'done' && (
        <div className="mt-4 bg-white rounded-xl border border-stone-200 shadow-soft p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-800">{file.name}</p>
              <p className="text-xs text-stone-500 mt-1">{fmtBytes(file.size)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleProcess}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg text-sm font-medium"
              >
                Process Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'processing' && <ProgressPanel progress={progress} />}

      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          <span>{error}</span>
        </div>
      )}

      {status === 'done' && result && (
        <ResultsPanel results={[result]} onDownload={handleDownload} onReset={handleReset} />
      )}
    </section>
  );
}
