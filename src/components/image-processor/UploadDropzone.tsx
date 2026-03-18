import type { RefObject } from 'react';

interface UploadDropzoneProps {
  accept: string;
  acceptLabels: string[];
  dragOver: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  isConfigurable: boolean;
  maxFileSizeLabel: string;
  processorHint: string;
  onDragStateChange: (dragging: boolean) => void;
  onFilesSelected: (files: FileList) => void;
}

export function UploadDropzone({
  accept,
  acceptLabels,
  dragOver,
  inputRef,
  isConfigurable,
  maxFileSizeLabel,
  processorHint,
  onDragStateChange,
  onFilesSelected,
}: UploadDropzoneProps) {
  return (
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
        onDragStateChange(true);
      }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={(event) => {
        event.preventDefault();
        onDragStateChange(false);
        onFilesSelected(event.dataTransfer.files);
      }}
    >
      <div className={`absolute -inset-[2px] rounded-2xl transition-opacity duration-300 ${
        dragOver
          ? 'opacity-100 dropzone-active-border'
          : 'opacity-0 group-hover:opacity-100 dropzone-active-border'
      }`}
      />
      <div className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-12 text-center cursor-pointer transition-all duration-300 bg-white ${
        dragOver
          ? 'border-teal-400 bg-teal-50/50 scale-[1.01]'
          : 'border-stone-200 hover:border-transparent'
      }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          aria-label={`Upload static images (${acceptLabels.join(', ')})`}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              onFilesSelected(event.target.files);
            }
          }}
        />

        <div className={`mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          dragOver ? 'bg-teal-100 scale-110' : 'bg-stone-100 group-hover:bg-teal-50'
        }`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-colors ${dragOver ? 'text-teal-700' : 'text-stone-500 group-hover:text-teal-600'}`}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p className="font-[var(--font-heading)] text-lg font-semibold text-stone-800 mb-1.5">
          {dragOver ? 'Drop to upload' : 'Drop static images here or click to browse'}
        </p>
        <p className="text-sm text-stone-600 mb-4">
          Up to 20 files - Max {maxFileSizeLabel} each - {acceptLabels.join(', ')}
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
  );
}
