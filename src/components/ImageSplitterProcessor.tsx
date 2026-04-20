import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProgressPanel } from './image-processor/ProgressPanel';
import { UploadDropzone } from './image-processor/UploadDropzone';
import type { ProcessedFile, Status } from './image-processor/types';
import { fmtBytes, readImageDimensions, revokeUrls } from './image-processor/utils';
import { getSplitRects, splitImage } from '../lib/split';

interface ImageSplitterProcessorProps {
  acceptFormats: string[];
  maxFileSize: number;
}

export default function ImageSplitterProcessor({
  acceptFormats,
  maxFileSize,
}: ImageSplitterProcessorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState('3');
  const [columns, setColumns] = useState('3');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewWidth, setPreviewWidth] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(0);
  const previewRequestRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      revokeUrls(results);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, results]);

  const processorHint = useMemo(() => {
    return `Split one static image into a ${rows} x ${columns} grid locally and download each tile separately.`;
  }, [columns, rows]);

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

    revokeUrls(results);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setFile(nextFile);
    setResults([]);
    setStatus('idle');
    setError('');
    void readImageDimensions(nextFile).then((dimensions) => {
      if (requestId !== previewRequestRef.current) {
        return;
      }
      setPreviewWidth(dimensions.width);
      setPreviewHeight(dimensions.height);
    });
    setPreviewUrl(URL.createObjectURL(nextFile));
  }, [acceptFormats, maxFileSize, previewUrl, results]);

  const handleReset = useCallback(() => {
    revokeUrls(results);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setResults([]);
    setStatus('idle');
    setProgress(0);
    setError('');
    setPreviewUrl('');
    setPreviewWidth(0);
    setPreviewHeight(0);
  }, [previewUrl, results]);

  const handleProcess = useCallback(async () => {
    if (!file) {
      return;
    }

    const parsedRows = Number.parseInt(rows, 10);
    const parsedColumns = Number.parseInt(columns, 10);

    if (!Number.isFinite(parsedRows) || parsedRows <= 0 || !Number.isFinite(parsedColumns) || parsedColumns <= 0) {
      setError('Enter valid row and column counts before splitting the image.');
      return;
    }

    setStatus('processing');
    setProgress(10);
    setError('');

    try {
      const pieces = await splitImage({ file, rows: parsedRows, columns: parsedColumns });

      const processed = pieces.map((piece) => ({
        name: file.name.replace(/\.[^.]+$/, '') + `-r${piece.row}-c${piece.column}` + file.name.slice(file.name.lastIndexOf('.')),
        originalSize: file.size,
        processedSize: piece.blob.size,
        url: URL.createObjectURL(piece.blob),
        blob: piece.blob,
        width: piece.width,
        height: piece.height,
        originalWidth: piece.width,
        originalHeight: piece.height,
        outputFormat: piece.outputFormat,
        note: `Grid piece row ${piece.row}, column ${piece.column}.`,
      }));

      setProgress(100);
      setResults(processed);
      setStatus('done');
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Image splitting failed.');
      setStatus('error');
    }
  }, [columns, file, rows]);

  const handleDownload = useCallback((result: ProcessedFile) => {
    const anchor = document.createElement('a');
    anchor.href = result.url;
    anchor.download = result.name;
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
          fileCountLabel="1 image only"
          onDragStateChange={setDragOver}
          onFilesSelected={handleFiles}
        />
      )}

      {status !== 'done' && (
        <div className="mt-5 bg-white rounded-2xl border border-stone-200 shadow-soft p-5 animate-fade-up space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-stone-700">
              <span className="block font-medium mb-2">Rows</span>
              <input
                type="number"
                min="1"
                value={rows}
                onChange={(event) => setRows(event.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </label>
            <label className="text-sm text-stone-700">
              <span className="block font-medium mb-2">Columns</span>
              <input
                type="number"
                min="1"
                value={columns}
                onChange={(event) => setColumns(event.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </label>
          </div>
          <p className="text-xs text-stone-500">{processorHint}</p>
        </div>
      )}

      {file && status !== 'done' && previewUrl && (
        <div className="mt-4 bg-white rounded-2xl border border-stone-200 shadow-soft p-5 animate-fade-up space-y-4">
          <div>
            <p className="text-sm font-semibold text-stone-800">Split preview</p>
            <p className="text-xs text-stone-500 mt-1">
              The grid below shows how the current {rows} x {columns} split will cut the uploaded image.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div
              className="relative mx-auto overflow-hidden rounded-xl border border-stone-200 bg-white"
              style={{
                width: '100%',
                maxWidth: '640px',
                aspectRatio: previewWidth > 0 && previewHeight > 0 ? `${previewWidth} / ${previewHeight}` : '1 / 1',
              }}
            >
              <img src={previewUrl} alt="Image split preview" className="absolute inset-0 h-full w-full object-contain" />
              {previewWidth > 0 && previewHeight > 0 && getSplitRects(
                previewWidth,
                previewHeight,
                Math.max(1, Number.parseInt(rows, 10) || 1),
                Math.max(1, Number.parseInt(columns, 10) || 1),
              ).map((rect) => (
                <div
                  key={`${rect.row}-${rect.column}`}
                  className="absolute border border-white/90 shadow-[0_0_0_1px_rgba(15,23,42,0.12)] bg-teal-500/10"
                  style={{
                    left: `${(rect.sourceX / previewWidth) * 100}%`,
                    top: `${(rect.sourceY / previewHeight) * 100}%`,
                    width: `${(rect.width / previewWidth) * 100}%`,
                    height: `${(rect.height / previewHeight) * 100}%`,
                  }}
                >
                  <span className="absolute left-1 top-1 rounded bg-stone-950/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {rect.row},{rect.column}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Source image: {previewWidth} x {previewHeight}px. The tool splits evenly by rounded pixel boundaries and exports each tile separately.
          </p>
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
                Split Image
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

      {status === 'done' && results.length > 0 && (
        <div className="animate-fade-up space-y-3">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 rounded-2xl p-5 text-white shadow-soft-lg">
            <p className="text-teal-100 text-sm mb-1">Split complete</p>
            <p className="text-2xl font-[var(--font-heading)] font-bold">{results.length} pieces</p>
          </div>

          {results.map((result, index) => (
            <div key={`${result.name}-${index}`} className="bg-white rounded-xl border border-stone-200 shadow-soft p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-800">{result.name}</p>
                  <p className="text-xs text-stone-500 mt-1">
                    {result.width} x {result.height}px
                    <span className="mx-1.5 text-stone-300">-</span>
                    {fmtBytes(result.processedSize)}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">{result.note}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(result)}
                  className="w-full sm:w-auto px-4 py-2 bg-stone-900 text-white text-sm rounded-lg"
                >
                  Download
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-3 border border-stone-200 text-stone-600 rounded-xl font-medium text-sm hover:bg-stone-50"
          >
            Split Another Image
          </button>
        </div>
      )}
    </section>
  );
}
