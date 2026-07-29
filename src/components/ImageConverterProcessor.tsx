import { ConvertConfigBar } from './image-converter/ConvertConfigBar';
import { ConvertResultPanel } from './image-converter/ConvertResultPanel';
import { useImageConverter } from './image-converter/useImageConverter';
import type { ImageConverterProcessorProps } from './image-converter/types';
import { MIME_LABELS } from './image-processor/presets';
import { ProgressPanel } from './image-processor/ProgressPanel';
import { UploadDropzone } from './image-processor/UploadDropzone';
import { fmtBytes } from './image-processor/utils';

const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function ImageConverterProcessor({
  acceptedTypes,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  outputType,
  showBackground = false,
  showQuality = false,
}: ImageConverterProcessorProps) {
  const converter = useImageConverter({
    acceptedTypes,
    createSelectedPreview: showBackground,
    maxFileSize,
    outputType,
  });
  const {
    backgroundColor,
    convertSelected,
    downloadResult,
    dragOver,
    error,
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
  } = converter;

  const accept = acceptedTypes.join(',');
  const acceptLabels = Array.from(new Set(acceptedTypes.map((type) => MIME_LABELS[type] ?? type)));
  const outputLabel = MIME_LABELS[outputType] ?? outputType;
  const hasConfigControls = showQuality || showBackground;
  const canEdit = status !== 'processing' && status !== 'done';

  return (
    <section className="max-w-2xl mx-auto px-5 py-6">
      <div aria-live="polite" className="sr-only">
        {status === 'validating' ? 'Checking image.' : ''}
        {status === 'processing' ? 'Converting image.' : ''}
        {status === 'done' ? 'Conversion complete.' : ''}
      </div>

      {canEdit && !selected && (
        <div className="relative">
          <UploadDropzone
            accept={accept}
            acceptLabels={acceptLabels}
            dragOver={dragOver}
            inputRef={inputRef}
            multiple={false}
            showConfigPanel={hasConfigControls}
            maxFileSizeLabel={fmtBytes(maxFileSize)}
            processorHint={`Output is locked to ${outputLabel}. Original pixel dimensions are kept.`}
            onDragStateChange={setDragOver}
            onFilesSelected={(files) => {
              void selectFiles(files);
            }}
          />
          {status === 'validating' && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 shadow-soft text-xs font-medium text-stone-600 animate-pulse-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                Checking image...
              </span>
            </div>
          )}
        </div>
      )}

      {canEdit && selected && (
        <div className="mt-4 bg-white rounded-xl border border-stone-200 shadow-soft overflow-hidden animate-fade-up">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">1 file selected</span>
            <button
              type="button"
              onClick={reset}
              className="-my-2 px-3 py-3 text-xs text-stone-500 hover:text-stone-700 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              Clear
            </button>
          </div>
          <div className="px-4 py-2.5 flex items-start gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-500">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p data-clarity-mask="true" className="truncate text-stone-700">{selected.file.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-stone-600">
                <span>{MIME_LABELS[selected.file.type] ?? selected.file.type}</span>
                <span className="text-stone-300">-</span>
                <span>{fmtBytes(selected.file.size)}</span>
                <span className="text-stone-300">-</span>
                <span>{selected.width} x {selected.height}px</span>
              </p>
            </div>
          </div>
          <div className="p-3 border-t border-stone-100">
            {showBackground && selectedPreviewUrl && (
              <div className="mb-3">
                <div
                  className="h-28 w-full rounded-lg border border-stone-200 overflow-hidden flex items-center justify-center transition-colors"
                  style={{ backgroundColor }}
                >
                  <img
                    src={selectedPreviewUrl}
                    alt="Selected image preview"
                    data-clarity-mask="true"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <p className="mt-1.5 text-xs text-stone-500">
                  If the image contains transparent pixels, they are filled with the background color below in the JPG output.
                </p>
              </div>
            )}
            <ConvertConfigBar
              outputLabel={outputLabel}
              showQuality={showQuality}
              showBackground={showBackground}
              quality={quality}
              backgroundColor={backgroundColor}
              onQualityChange={setQuality}
              onBackgroundChange={setBackgroundColor}
            />
            <button
              type="button"
              onClick={() => {
                void convertSelected();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl font-[var(--font-heading)] font-semibold text-[15px] shadow-soft hover:shadow-soft-lg hover:from-teal-700 hover:to-teal-600 active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              Convert to {outputLabel}
            </button>
          </div>
        </div>
      )}

      {status === 'processing' && <ProgressPanel progress={progress} />}

      {error && (
        <div role="alert" data-clarity-mask="true" className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 animate-fade-up">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="min-w-0 flex-1 break-words">{error}</span>
        </div>
      )}

      {status === 'done' && result && (
        <ConvertResultPanel
          result={result}
          onDownload={downloadResult}
          onReset={reset}
        />
      )}
    </section>
  );
}
