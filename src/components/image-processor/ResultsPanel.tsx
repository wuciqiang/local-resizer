import type { ProcessedFile } from './types';
import { fmtBytes, reduction } from './utils';

interface ResultsPanelProps {
  results: ProcessedFile[];
  onDownload: (result: ProcessedFile) => void;
  onReset: () => void;
}

export function ResultsPanel({ results, onDownload, onReset }: ResultsPanelProps) {
  return (
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
          <div key={`${result.name}-${index}`} role="listitem" className="bg-white rounded-xl border border-stone-200 shadow-soft p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
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
              </div>
              <button
                onClick={() => onDownload(result)}
                aria-label={`Download ${result.name}`}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 active:scale-[0.97] transition-all shrink-0 text-center"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl font-medium text-sm hover:bg-stone-50 transition-colors"
        >
          Process More
        </button>
      </div>
    </div>
  );
}
