import type { PngChoice } from './types';
import { fmtBytes } from './utils';

interface SelectedFilesPanelProps {
  effectiveAction: 'compress' | 'resize';
  effectiveTargetSizeBytes?: number;
  files: File[];
  pngChoice: PngChoice;
  onPngChoiceChange: (value: PngChoice) => void;
  onProcess: () => void;
  onReset: () => void;
}

export function SelectedFilesPanel({
  effectiveAction,
  effectiveTargetSizeBytes,
  files,
  pngChoice,
  onPngChoiceChange,
  onProcess,
  onReset,
}: SelectedFilesPanelProps) {
  return (
    <div className="mt-4 bg-white rounded-xl border border-stone-200 shadow-soft overflow-hidden animate-fade-up">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
        <span className="text-sm font-medium text-stone-700">
          {files.length} file{files.length > 1 ? 's' : ''} selected
        </span>
        <button onClick={onReset} className="text-xs text-stone-500 hover:text-stone-700 transition-colors">
          Clear
        </button>
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
              PNG files detected - choose compression method:
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onPngChoiceChange('webp')}
                className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
              >
                Convert to WebP (keep dimensions)
              </button>
              <button
                type="button"
                onClick={() => onPngChoiceChange('png-scale')}
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
            <button
              type="button"
              onClick={() => onPngChoiceChange('pending')}
              className="text-xs text-teal-500 hover:text-teal-700 underline ml-auto"
            >
              Change
            </button>
          </div>
        )}
        <button
          onClick={onProcess}
          className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl font-[var(--font-heading)] font-semibold text-[15px] shadow-soft hover:shadow-soft-lg hover:from-teal-700 hover:to-teal-600 active:scale-[0.99] transition-all duration-200"
        >
          {effectiveAction === 'compress' ? 'Compress' : 'Resize'} {files.length > 1 ? `${files.length} Files` : 'File'}
        </button>
      </div>
    </div>
  );
}
