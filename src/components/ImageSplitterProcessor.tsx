import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProgressPanel } from './image-processor/ProgressPanel';
import { UploadDropzone } from './image-processor/UploadDropzone';
import type { ProcessedFile, Status } from './image-processor/types';
import {
  createZipBlob,
  downloadBlob,
  fmtBytes,
  getSplitDownloadName,
  readImageDimensions,
  revokeUrls,
  uniqueZipEntries,
} from './image-processor/utils';
import {
  MAX_SPLIT_AXIS,
  getSplitGridError,
  getSplitRects,
  splitImage,
} from '../lib/split';
import { fileCountBucket, gridCountBucket, mimeFormat, resultFormatSummary, sizeBucket, trackToolEvent } from '../lib/analytics';

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
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const previewRequestRef = useRef(0);
  const processingRef = useRef(false);
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
    return `Split one static image into a ${rows} x ${columns} grid locally and download tiles individually or as a ZIP.`;
  }, [columns, rows]);

  const parsedRows = Number(rows);
  const parsedColumns = Number(columns);
  const previewGridError = getSplitGridError(
    previewWidth || Number.MAX_SAFE_INTEGER,
    previewHeight || Number.MAX_SAFE_INTEGER,
    parsedRows,
    parsedColumns,
  );
  const previewRects = useMemo(() => {
    if (previewWidth <= 0 || previewHeight <= 0 || previewGridError) {
      return [];
    }

    return getSplitRects(previewWidth, previewHeight, parsedRows, parsedColumns);
  }, [parsedColumns, parsedRows, previewGridError, previewHeight, previewWidth]);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    if (processingRef.current) {
      return;
    }

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
    const nextPreviewUrl = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setResults([]);
    setStatus('idle');
    setError('');
    setPreviewWidth(0);
    setPreviewHeight(0);
    setPreviewUrl(nextPreviewUrl);
    void readImageDimensions(nextFile).then((dimensions) => {
      if (requestId !== previewRequestRef.current) {
        URL.revokeObjectURL(nextPreviewUrl);
        return;
      }
      setPreviewWidth(dimensions.width);
      setPreviewHeight(dimensions.height);
      trackToolEvent('upload_completed', {
        tool_action: 'select_files',
        tool_mode: 'image_splitter',
        file_count: 1,
        file_count_bucket: fileCountBucket(1),
        input_format: mimeFormat(nextFile.type),
        input_size_bucket: sizeBucket(nextFile.size),
      });
    }).catch((dimensionError) => {
      if (requestId !== previewRequestRef.current) {
        URL.revokeObjectURL(nextPreviewUrl);
        return;
      }
      URL.revokeObjectURL(nextPreviewUrl);
      setFile(null);
      setPreviewUrl('');
      setPreviewWidth(0);
      setPreviewHeight(0);
      setError(dimensionError instanceof Error ? dimensionError.message : 'Failed to read the image dimensions.');
    });
  }, [acceptFormats, maxFileSize, previewUrl, results]);

  const handleReset = useCallback(() => {
    previewRequestRef.current += 1;
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
    if (!file || processingRef.current) {
      return;
    }

    const gridError = getSplitGridError(
      previewWidth || Number.MAX_SAFE_INTEGER,
      previewHeight || Number.MAX_SAFE_INTEGER,
      parsedRows,
      parsedColumns,
    );
    if (gridError) {
      setError(gridError);
      return;
    }

    processingRef.current = true;
    setStatus('processing');
    setProgress(10);
    setError('');
    trackToolEvent('process_started', {
      tool_action: 'split',
      tool_mode: 'image_splitter',
      file_count: 1,
      file_count_bucket: fileCountBucket(1),
      input_format: mimeFormat(file.type),
      result_type: 'grid_split',
      grid_rows: gridCountBucket(parsedRows),
      grid_columns: gridCountBucket(parsedColumns),
    });

    try {
      const pieces = await splitImage({ file, rows: parsedRows, columns: parsedColumns });

      const processed = pieces.map((piece) => ({
        name: getSplitDownloadName(file.name, piece.row, piece.column, piece.outputFormat),
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
      trackToolEvent('tool_result_view', {
        tool_action: 'split',
        tool_mode: 'image_splitter',
        result_type: 'processed',
        file_count: processed.length,
        file_count_bucket: fileCountBucket(processed.length),
        input_format: mimeFormat(file.type),
        output_format: resultFormatSummary(processed),
        grid_rows: gridCountBucket(parsedRows),
        grid_columns: gridCountBucket(parsedColumns),
      });
      trackToolEvent('process_completed', {
        tool_action: 'split',
        tool_mode: 'image_splitter',
        result_type: 'processed',
        file_count: processed.length,
        file_count_bucket: fileCountBucket(processed.length),
        input_format: mimeFormat(file.type),
        output_format: resultFormatSummary(processed),
        grid_rows: gridCountBucket(parsedRows),
        grid_columns: gridCountBucket(parsedColumns),
      });
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Image splitting failed.');
      setStatus('error');
      trackToolEvent('process_failed', {
        tool_action: 'split',
        tool_mode: 'image_splitter',
        result_type: 'error',
        error_type: 'image_splitting_failed',
      });
    } finally {
      processingRef.current = false;
    }
  }, [file, parsedColumns, parsedRows, previewHeight, previewWidth]);

  const handleDownload = useCallback((result: ProcessedFile) => {
    trackToolEvent('download_result', {
      tool_action: 'split',
      tool_mode: 'image_splitter',
      result_type: 'single',
      output_format: resultFormatSummary([result]),
    });
    downloadBlob(result.blob, result.name);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0 || isDownloadingAll) {
      return;
    }

    setIsDownloadingAll(true);
    try {
      const zipBlob = await createZipBlob(uniqueZipEntries(results));
      trackToolEvent('download_result', {
        tool_action: 'split',
        tool_mode: 'image_splitter',
        result_type: 'batch_zip',
        file_count: results.length,
        file_count_bucket: fileCountBucket(results.length),
        output_format: resultFormatSummary(results),
      });
      downloadBlob(zipBlob, 'localresizer-image-pieces.zip');
    } catch (zipError) {
      setError(zipError instanceof Error ? zipError.message : 'Preparing the ZIP download failed.');
    } finally {
      setIsDownloadingAll(false);
    }
  }, [isDownloadingAll, results]);

  const canEdit = status !== 'processing' && status !== 'done';

  return (
    <section className="max-w-3xl mx-auto px-5 py-6">
      {canEdit && (
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

      {canEdit && (
        <div className="mt-5 bg-white rounded-2xl border border-stone-200 shadow-soft p-5 animate-fade-up space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-stone-700">
              <span className="block font-medium mb-2">Rows</span>
              <input
                type="number"
                min="1"
                max={MAX_SPLIT_AXIS}
                value={rows}
                onChange={(event) => {
                  trackToolEvent('tool_option_select', {
                    tool_action: 'grid_rows_select',
                    tool_mode: 'image_splitter',
                    option_group: 'grid_rows',
                    option_value: gridCountBucket(Number.parseInt(event.target.value, 10)),
                  });
                  setRows(event.target.value);
                }}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </label>
            <label className="text-sm text-stone-700">
              <span className="block font-medium mb-2">Columns</span>
              <input
                type="number"
                min="1"
                max={MAX_SPLIT_AXIS}
                value={columns}
                onChange={(event) => {
                  trackToolEvent('tool_option_select', {
                    tool_action: 'grid_columns_select',
                    tool_mode: 'image_splitter',
                    option_group: 'grid_columns',
                    option_value: gridCountBucket(Number.parseInt(event.target.value, 10)),
                  });
                  setColumns(event.target.value);
                }}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </label>
          </div>
          <p className={`text-xs ${previewGridError ? 'text-red-600' : 'text-stone-500'}`}>
            {previewGridError ?? processorHint}
          </p>
        </div>
      )}

      {file && canEdit && previewUrl && (
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
              <img data-clarity-mask="true" src={previewUrl} alt="Image split preview" className="absolute inset-0 h-full w-full object-contain" />
              {previewRects.map((rect) => (
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

      {file && canEdit && (
        <div className="mt-4 bg-white rounded-xl border border-stone-200 shadow-soft p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p data-clarity-mask="true" className="text-sm font-medium text-stone-800">{file.name}</p>
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
        <div data-clarity-mask="true" className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          <span>{error}</span>
        </div>
      )}

      {status === 'done' && results.length > 0 && (
        <div className="animate-fade-up space-y-3">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 rounded-2xl p-5 text-white shadow-soft-lg">
            <p className="text-teal-100 text-sm mb-1">Split complete</p>
            <p className="text-2xl font-[var(--font-heading)] font-bold">{results.length} pieces</p>
          </div>

          {results.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium text-sm hover:bg-stone-800 disabled:cursor-wait disabled:bg-stone-500 transition-colors"
            >
              {isDownloadingAll ? 'Preparing ZIP...' : `Download all ${results.length} pieces`}
            </button>
          )}

          {results.map((result, index) => (
            <div key={`${result.name}-${index}`} className="bg-white rounded-xl border border-stone-200 shadow-soft p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
                <div>
                  <p data-clarity-mask="true" className="text-sm font-medium text-stone-800">{result.name}</p>
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
