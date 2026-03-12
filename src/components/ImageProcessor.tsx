import { useState, useCallback, useRef } from 'react';

interface Props {
  action: 'compress' | 'resize';
  format?: string;
  targetSizeBytes?: number;
  dimensions?: { width: number; height: number };
  acceptFormats: string[];
  maxFileSize: number;
}

interface ProcessedFile {
  name: string;
  originalSize: number;
  processedSize: number;
  url: string;
  blob: Blob;
}

type Status = 'idle' | 'processing' | 'done' | 'error';

export default function ImageProcessor({ action, format, targetSizeBytes, dimensions, acceptFormats, maxFileSize }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = acceptFormats.join(',');

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const valid: File[] = [];
    for (const f of Array.from(incoming)) {
      if (f.size > maxFileSize) {
        setError(`${f.name} exceeds ${fmtBytes(maxFileSize)} limit`);
        return;
      }
      valid.push(f);
    }
    if (valid.length > 20) {
      setError('Maximum 20 files at once');
      return;
    }
    setFiles(valid);
    setResults([]);
    setStatus('idle');
    setError('');
  }, [maxFileSize]);

  const processFiles = useCallback(async () => {
    if (files.length === 0) return;
    setStatus('processing');
    setProgress(0);
    setError('');
    const processed: ProcessedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let blob: Blob;

        if (action === 'resize' && dimensions) {
          const { resizeImage } = await import('../lib/resize');
          const result = await resizeImage({ file, targetDimensions: dimensions });
          blob = result.blob;
        } else if (targetSizeBytes) {
          if (action === 'compress') {
            const { compressImage } = await import('../lib/compress');
            const result = await compressImage({ file, targetSizeBytes, format: format ? `image/${format}` : undefined });
            blob = result.blob;
          } else {
            const { resizeImage } = await import('../lib/resize');
            const result = await resizeImage({ file, targetSizeBytes });
            blob = result.blob;
          }
        } else {
          blob = file;
        }

        const url = URL.createObjectURL(blob);
        processed.push({ name: file.name, originalSize: file.size, processedSize: blob.size, url, blob });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setResults(processed);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Processing failed');
      setStatus('error');
    }
  }, [files, action, format, targetSizeBytes, dimensions]);

  const downloadFile = (r: ProcessedFile) => {
    const a = document.createElement('a');
    a.href = r.url;
    a.download = r.name;
    a.click();
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setStatus('idle');
    setProgress(0);
    setError('');
  };

  const reduction = (orig: number, proc: number) => Math.max(0, Math.round((1 - proc / orig) * 100));

  return (
    <section className="max-w-2xl mx-auto px-5 py-6">
      {/* Dropzone */}
      {status !== 'done' && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload images"
          className="relative group"
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          {/* Animated gradient border */}
          <div className={`absolute -inset-[2px] rounded-2xl transition-opacity duration-300 ${
            dragOver ? 'opacity-100 dropzone-active-border' : 'opacity-0 group-hover:opacity-100 dropzone-active-border'
          }`} />
          <div className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 bg-white ${
            dragOver
              ? 'border-teal-400 bg-teal-50/50 scale-[1.01]'
              : 'border-stone-200 hover:border-transparent'
          }`}>
            <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />

            {/* Upload icon */}
            <div className={`mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              dragOver ? 'bg-teal-100 scale-110' : 'bg-stone-100 group-hover:bg-teal-50'
            }`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${dragOver ? 'text-teal-600' : 'text-stone-400 group-hover:text-teal-500'}`}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <p className="font-[var(--font-heading)] text-lg font-semibold text-stone-800 mb-1.5">
              {dragOver ? 'Drop to upload' : 'Drop images here or click to browse'}
            </p>
            <p className="text-sm text-stone-400 mb-4">
              Up to 20 files &middot; Max {fmtBytes(maxFileSize)} each &middot; JPEG, PNG, WebP, GIF
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Files never leave your device
            </div>
          </div>
        </div>
      )}

      {/* Selected files + process button */}
      {files.length > 0 && status === 'idle' && (
        <div className="mt-5 animate-fade-up">
          <div className="bg-white rounded-xl border border-stone-200 shadow-soft overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-600">
                {files.length} file{files.length > 1 ? 's' : ''} ready
              </span>
              <button onClick={reset} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                Clear
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-sm border-b border-stone-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <span className="truncate text-stone-700 flex-1">{f.name}</span>
                  <span className="text-stone-400 text-xs shrink-0">{fmtBytes(f.size)}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={processFiles}
            className="mt-4 w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl font-[var(--font-heading)] font-semibold text-[15px] shadow-soft hover:shadow-soft-lg hover:from-teal-700 hover:to-teal-600 active:scale-[0.99] transition-all duration-200"
          >
            {action === 'compress' ? 'Compress' : 'Resize'} {files.length > 1 ? `${files.length} Files` : 'File'}
          </button>
        </div>
      )}

      {/* Processing */}
      {status === 'processing' && (
        <div className="mt-6 animate-fade-up">
          <div className="bg-white rounded-xl border border-stone-200 shadow-soft p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-stone-700 animate-pulse-soft">Processing...</span>
              <span className="text-sm font-semibold text-teal-600 tabular-nums">{progress}%</span>
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

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 animate-fade-up">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-red-400">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {status === 'done' && results.length > 0 && (
        <div className="animate-fade-up">
          {/* Summary bar */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 rounded-2xl p-5 text-white mb-4 shadow-soft-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm mb-0.5">Total saved</p>
                <p className="text-2xl font-[var(--font-heading)] font-bold">
                  {fmtBytes(results.reduce((s, r) => s + (r.originalSize - r.processedSize), 0))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-teal-100 text-sm mb-0.5">{results.length} file{results.length > 1 ? 's' : ''}</p>
                <p className="text-2xl font-[var(--font-heading)] font-bold">
                  {reduction(
                    results.reduce((s, r) => s + r.originalSize, 0),
                    results.reduce((s, r) => s + r.processedSize, 0),
                  )}%
                </p>
              </div>
            </div>
          </div>

          {/* File results */}
          <div className="space-y-2.5 stagger-children">
            {results.map((r, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200 shadow-soft p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-800 truncate">{r.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {fmtBytes(r.originalSize)}
                    <span className="mx-1.5 text-stone-300">&rarr;</span>
                    {fmtBytes(r.processedSize)}
                    <span className="ml-2 text-emerald-600 font-medium">-{reduction(r.originalSize, r.processedSize)}%</span>
                  </p>
                </div>
                <button
                  onClick={() => downloadFile(r)}
                  className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 active:scale-[0.97] transition-all shrink-0"
                >
                  Download
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
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

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}