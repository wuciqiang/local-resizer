import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ResizeMode } from '../data/routes';

interface Props {
  action: 'compress' | 'resize';
  format?: string;
  targetSizeBytes?: number;
  dimensions?: { width: number; height: number };
  acceptFormats: string[];
  maxFileSize: number;
  resizeMode?: ResizeMode;
  forceCanvasSize?: boolean;
}

interface ProcessedFile {
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

interface QuickSizePreset {
  label: string;
  value: string;
  unit: 'kb' | 'mb';
}

interface QuickDimensionPreset {
  label: string;
  width: number;
  height: number;
}

type Status = 'idle' | 'processing' | 'done' | 'error';
type PngChoice = 'pending' | 'webp' | 'png-scale' | 'none';

const MIME_LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

const SIZE_PRESETS: QuickSizePreset[] = [
  { label: '50 KB', value: '50', unit: 'kb' },
  { label: '200 KB', value: '200', unit: 'kb' },
  { label: '2 MB', value: '2', unit: 'mb' },
];

const DIMENSION_PRESETS: QuickDimensionPreset[] = [
  { label: '1280 x 720', width: 1280, height: 720 },
  { label: '1920 x 1080', width: 1920, height: 1080 },
  { label: '1080 x 1080', width: 1080, height: 1080 },
];

export default function ImageProcessor({
  action,
  format,
  targetSizeBytes,
  dimensions,
  acceptFormats,
  maxFileSize,
  resizeMode = 'fit',
  forceCanvasSize = false,
}: Props) {
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
  const acceptLabels = useMemo(() => {
    return Array.from(new Set(acceptFormats.map((type) => MIME_LABELS[type] ?? type)));
  }, [acceptFormats]);

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
    const hasPng = valid.some((f) => f.type === 'image/png');
    setPngChoice(hasPng ? 'pending' : 'none');
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
          const useForceCanvas = isConfigurable ? true : forceCanvasSize;
          const result = await resizeImage({
            file,
            targetDimensions: effectiveDimensions,
            resizeMode: isConfigurable ? 'cover' : resizeMode,
            forceCanvasSize: useForceCanvas,
          });
          blob = result.blob;
          width = result.width;
          height = result.height;
          originalWidth = result.originalWidth;
          originalHeight = result.originalHeight;
          note = result.note;
        } else if (effectiveTargetSizeBytes) {
          const { compressImage } = await import('../lib/compress');
          const isPng = file.type === 'image/png';
          const strategy = isPng && pngChoice !== 'none' ? pngChoice as 'webp' | 'png-scale' : 'auto';
          const result = await compressImage({
            file,
            targetSizeBytes: effectiveTargetSizeBytes,
            format: format ? `image/${format}` : undefined,
            pngStrategy: strategy,
            onProgress: (p) => {
              const fileBase = Math.round((index / files.length) * 100);
              const fileShare = Math.round((1 / files.length) * 100);
              setProgress(Math.min(100, fileBase + Math.round((p / 100) * fileShare)));
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

        const url = URL.createObjectURL(blob);
        processed.push({
          name: file.name,
          originalSize: file.size,
          processedSize: blob.size,
          url,
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
    pngChoice,
    resizeMode,
  ]);

  const downloadFile = useCallback((result: ProcessedFile) => {
    const anchor = document.createElement('a');
    anchor.href = result.url;
    let downloadName = result.name;
    if (result.outputFormat === 'image/webp' && !downloadName.endsWith('.webp')) {
      downloadName = downloadName.replace(/\.[^.]+$/, '.webp');
    }
    anchor.download = downloadName;
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
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload static images"
          className="relative group"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            handleFiles(event.dataTransfer.files);
          }}
        >
          <div className={`absolute -inset-[2px] rounded-2xl transition-opacity duration-300 ${
            dragOver ? 'opacity-100 dropzone-active-border' : 'opacity-0 group-hover:opacity-100 dropzone-active-border'
          }`} />
          <div className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 bg-white ${
            dragOver
              ? 'border-teal-400 bg-teal-50/50 scale-[1.01]'
              : 'border-stone-200 hover:border-transparent'
          }`}>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              multiple
              aria-label={`Upload static images (${acceptLabels.join(', ')})`}
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  handleFiles(event.target.files);
                }
              }}
            />

            <div className={`mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              dragOver ? 'bg-teal-100 scale-110' : 'bg-stone-100 group-hover:bg-teal-50'
            }`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${dragOver ? 'text-teal-700' : 'text-stone-500 group-hover:text-teal-600'}`}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <p className="font-[var(--font-heading)] text-lg font-semibold text-stone-800 mb-1.5">
              {dragOver ? 'Drop to upload' : 'Drop static images here or click to browse'}
            </p>
            <p className="text-sm text-stone-600 mb-4">
              Up to 20 files - Max {fmtBytes(maxFileSize)} each - {acceptLabels.join(', ')}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Processed locally in your browser
            </div>

            {!isConfigurable && (
              <p className="mt-4 text-xs text-stone-500">{processorHint}</p>
            )}
          </div>
        </div>
      )}

      {isConfigurable && (
        <div className="mt-5 bg-white rounded-2xl border border-stone-200 shadow-soft p-5 animate-fade-up">
          <div className="flex gap-2 mb-4">
            <button type="button" className={tabClass(toolAction === 'compress')} onClick={() => setToolAction('compress')}>Compress</button>
            <button type="button" className={tabClass(toolAction === 'resize')} onClick={() => setToolAction('resize')}>Resize</button>
          </div>

          {toolAction === 'compress' && (
            <div>
              <label htmlFor="target-size-input" className="block text-sm font-medium text-stone-800 mb-2">Target file size</label>
              <div className="flex gap-2">
                <input
                  id="target-size-input"
                  type="number"
                  min="1"
                  value={sizeValue}
                  onChange={(e) => setSizeValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  placeholder="e.g. 200"
                  aria-label="Target file size value"
                />
                <label htmlFor="size-unit-select" className="sr-only">File size unit</label>
                <select
                  id="size-unit-select"
                  value={sizeUnit}
                  onChange={(e) => setSizeUnit(e.target.value as 'kb' | 'mb')}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  aria-label="File size unit (KB or MB)"
                >
                  <option value="kb">KB</option>
                  <option value="mb">MB</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => { setSizeValue(preset.value); setSizeUnit(preset.unit); }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-50 border border-stone-200 text-stone-700 hover:border-teal-500 hover:text-teal-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {toolAction === 'resize' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Output dimensions (px)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  value={widthValue}
                  onChange={(e) => setWidthValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Width"
                />
                <span className="text-stone-500 text-sm">x</span>
                <input
                  type="number"
                  min="1"
                  value={heightValue}
                  onChange={(e) => setHeightValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Height"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {DIMENSION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => { setWidthValue(String(preset.width)); setHeightValue(String(preset.height)); }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-50 border border-stone-200 text-stone-700 hover:border-teal-500 hover:text-teal-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-stone-500">{processorHint}</p>
        </div>
      )}

      {files.length > 0 && status !== 'done' && (
        <div className="mt-4 bg-white rounded-xl border border-stone-200 shadow-soft overflow-hidden animate-fade-up">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">{files.length} file{files.length > 1 ? 's' : ''} selected</span>
            <button onClick={reset} className="text-xs text-stone-500 hover:text-stone-700 transition-colors">Clear</button>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="px-4 py-2.5 flex items-center gap-3 text-sm border-b border-stone-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-500">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <span className="truncate text-stone-700 flex-1">{file.name}</span>
                <span className="text-stone-600 text-xs shrink-0">{fmtBytes(file.size)}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-stone-100">
            {pngChoice === 'pending' && effectiveTargetSizeBytes && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  PNG files detected — choose compression method:
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPngChoice('webp')}
                    className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                  >
                    Convert to WebP (keep dimensions)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPngChoice('png-scale')}
                    className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    Keep PNG (may reduce dimensions)
                  </button>
                </div>
              </div>
            )}
            {pngChoice !== 'none' && pngChoice !== 'pending' && effectiveTargetSizeBytes && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                <span className="text-xs text-teal-700">
                  PNG strategy: <strong>{pngChoice === 'webp' ? 'Convert to WebP' : 'Keep PNG (scale)'}</strong>
                </span>
                <button type="button" onClick={() => setPngChoice('pending')} className="text-xs text-teal-500 hover:text-teal-700 underline ml-auto">Change</button>
              </div>
            )}
            <button
              onClick={processFiles}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl font-[var(--font-heading)] font-semibold text-[15px] shadow-soft hover:shadow-soft-lg hover:from-teal-700 hover:to-teal-600 active:scale-[0.99] transition-all duration-200"
            >
              {effectiveAction === 'compress' ? 'Compress' : 'Resize'} {files.length > 1 ? `${files.length} Files` : 'File'}
            </button>
          </div>
        </div>
      )}

      {status === 'processing' && (
        <div className="mt-6 animate-fade-up">
          <div className="bg-white rounded-xl border border-stone-200 shadow-soft p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-stone-700 animate-pulse-soft">Processing...</span>
              <span className="text-sm font-semibold text-teal-700 tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

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
        <div className="animate-fade-up">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 rounded-2xl p-5 text-white mb-4 shadow-soft-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm mb-0.5">Total saved</p>
                <p className="text-2xl font-[var(--font-heading)] font-bold">
                  {fmtBytes(results.reduce((sum, result) => sum + (result.originalSize - result.processedSize), 0))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-teal-100 text-sm mb-0.5">{results.length} file{results.length > 1 ? 's' : ''}</p>
                <p className="text-2xl font-[var(--font-heading)] font-bold">
                  {reduction(
                    results.reduce((sum, result) => sum + result.originalSize, 0),
                    results.reduce((sum, result) => sum + result.processedSize, 0),
                  )}%
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 stagger-children" role="list" aria-label="Processed files">
            {results.map((result, index) => (
              <div key={`${result.name}-${index}`} role="listitem" className="bg-white rounded-xl border border-stone-200 shadow-soft p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800 truncate">{result.name}</p>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {fmtBytes(result.originalSize)}
                      <span className="mx-1.5 text-stone-300">-&gt;</span>
                      {fmtBytes(result.processedSize)}
                      <span className="ml-2 text-emerald-600 font-medium">-{reduction(result.originalSize, result.processedSize)}%</span>
                    </p>
                    <p className="text-xs text-stone-500 mt-1.5">
                      {result.originalWidth} x {result.originalHeight}px
                      <span className="mx-1.5 text-stone-300">-&gt;</span>
                      {result.width} x {result.height}px
                      {result.outputFormat && (
                        <span className="ml-2 text-blue-600 font-medium">Converted to WebP</span>
                      )}
                      {!result.outputFormat && result.width !== result.originalWidth && result.height !== result.originalHeight && (
                        <span className="ml-2 text-amber-600 font-medium">Dimensions changed</span>
                      )}
                    </p>
                    {result.note && (
                      <p className="text-xs text-stone-500 mt-2">{result.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => downloadFile(result)}
                    aria-label={`Download ${result.name}`}
                    className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 active:scale-[0.97] transition-all shrink-0"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl font-medium text-sm hover:bg-stone-50 transition-colors"
            >
              Process More
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function getInitialSizeUnit(targetSizeBytes?: number): 'kb' | 'mb' {
  if (!targetSizeBytes || targetSizeBytes < 1024 * 1024) {
    return 'kb';
  }

  return 'mb';
}

function getInitialSizeValue(targetSizeBytes?: number): string {
  if (!targetSizeBytes) {
    return '200';
  }

  if (targetSizeBytes >= 1024 * 1024) {
    const value = targetSizeBytes / (1024 * 1024);
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  return String(Math.round(targetSizeBytes / 1024));
}

function parseTargetSize(value: string, unit: 'kb' | 'mb'): number | undefined {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return undefined;
  }

  return unit === 'mb'
    ? Math.round(numericValue * 1024 * 1024)
    : Math.round(numericValue * 1024);
}

function parseDimensions(widthValue: string, heightValue: string): { width: number; height: number } | undefined {
  const width = Number.parseInt(widthValue, 10);
  const height = Number.parseInt(heightValue, 10);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return undefined;
  }

  return { width, height };
}

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const image = new Image();
  image.src = URL.createObjectURL(file);

  try {
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(image.src);
  }
}

function revokeUrls(items: Array<{ url: string }>): void {
  for (const item of items) {
    URL.revokeObjectURL(item.url);
  }
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${formatDecimal(bytes / 1024)} KB`;
  }
  return `${formatDecimal(bytes / (1024 * 1024))} MB`;
}

function reduction(originalSize: number, processedSize: number): number {
  return Math.max(0, Math.round((1 - processedSize / originalSize) * 100));
}

function tabClass(active: boolean): string {
  return [
    'px-3.5 py-2 rounded-xl text-sm font-medium transition-all border',
    active
      ? 'bg-teal-600 border-teal-600 text-white shadow-soft'
      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-teal-300 hover:text-teal-700',
  ].join(' ');
}

function formatDecimal(value: number): string {
  return Number(value.toFixed(1)).toString();
}
