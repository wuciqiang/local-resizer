import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProgressPanel } from './image-processor/ProgressPanel';
import { ResultsPanel } from './image-processor/ResultsPanel';
import { UploadDropzone } from './image-processor/UploadDropzone';
import type { ProcessedFile, Status } from './image-processor/types';
import { fmtBytes, getDownloadName, parseDimensions, parseTargetSize, revokeUrls } from './image-processor/utils';

interface SignatureProcessorProps {
  acceptFormats: string[];
  defaultDimensions: { width: number; height: number };
  defaultTargetSizeBytes: number;
  maxFileSize: number;
}

type OutputMode = 'png' | 'jpeg';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (result) {
        revokeUrls([result]);
      }
    };
  }, [result]);

  const processorHint = useMemo(() => {
    return `Trim extra whitespace, resize the signature to ${widthValue} x ${heightValue}px, and export as ${outputMode.toUpperCase()}.`;
  }, [heightValue, outputMode, widthValue]);

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

    if (result) {
      revokeUrls([result]);
    }

    setFile(nextFile);
    setResult(null);
    setStatus('idle');
    setError('');
  }, [acceptFormats, maxFileSize, result]);

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

    try {
      const { detectTrimBounds } = await import('../lib/image/trim');
      const { resizeImage } = await import('../lib/resize');
      const { compressImage } = await import('../lib/compress');

      let workingFile = file;
      let noteParts: string[] = [];

      if (trimWhitespace) {
        const bounds = await detectTrimBounds({ file });
        if (bounds) {
          const image = new Image();
          const url = URL.createObjectURL(file);
          image.src = url;
          await image.decode();

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

          workingFile = new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
          noteParts.push('Trimmed extra whitespace around the signature.');
          URL.revokeObjectURL(url);
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

      const compressed = await compressImage({
        file: resizedFile,
        targetSizeBytes,
        format: outputMode === 'jpeg' ? 'image/jpeg' : 'image/png',
        pngStrategy: outputMode === 'png' ? 'png-scale' : 'auto',
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
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Signature processing failed.');
      setStatus('error');
    }
  }, [file, heightValue, outputMode, sizeValue, trimWhitespace, widthValue]);

  const handleReset = useCallback(() => {
    if (result) {
      revokeUrls([result]);
    }
    setFile(null);
    setResult(null);
    setStatus('idle');
    setProgress(0);
    setError('');
  }, [result]);

  const handleDownload = useCallback((processed: ProcessedFile) => {
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
                onChange={(event) => setTrimWhitespace(event.target.checked)}
              />
              Automatically trim extra whitespace
            </label>

            <label className="text-sm text-stone-700">
              <span className="block font-medium mb-2">Output format</span>
              <select
                value={outputMode}
                onChange={(event) => setOutputMode(event.target.value as OutputMode)}
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
