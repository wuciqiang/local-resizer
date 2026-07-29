import type { ConverterResult } from './types';
import { getConverterNextStep, summarizeSizeChange } from './controller';
import { fmtBytes } from '../image-processor/utils';
import { MIME_LABELS } from '../image-processor/presets';

interface ConvertResultPanelProps {
  result: ConverterResult;
  onDownload: () => void;
  onReset: () => void;
}

export function ConvertResultPanel({ result, onDownload, onReset }: ConvertResultPanelProps) {
  const inputLabel = MIME_LABELS[result.inputFormat] ?? result.inputFormat;
  const outputLabel = MIME_LABELS[result.outputFormat] ?? result.outputFormat;
  const change = summarizeSizeChange(result.originalSize, result.outputSize);
  const sizeSummary = change.direction === 'same'
    ? 'same size'
    : `${change.percentageLabel} ${change.direction}`;
  const nextStep = getConverterNextStep(result.outputFormat, change.direction);

  return (
    <div className="mt-4 animate-fade-up">
      <div className="bg-white rounded-xl border border-stone-200 shadow-soft p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800">Conversion complete</p>
            <p className="text-xs text-stone-500 mt-0.5">
              {inputLabel}
              <span className="mx-1.5 text-stone-300">-&gt;</span>
              {outputLabel}
              <span className="mx-1.5 text-stone-300">-</span>
              {result.width} x {result.height}px kept
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-soft p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className="h-28 w-full sm:w-40 shrink-0 rounded-lg border border-stone-100 bg-stone-50 overflow-hidden flex items-center justify-center">
            <img
              src={result.url}
              alt="Converted image preview"
              data-clarity-mask="true"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p data-clarity-mask="true" className="text-sm font-medium text-stone-800 truncate">{result.downloadName}</p>
            <p className="text-xs text-stone-600 mt-1">
              Original: {fmtBytes(result.originalSize)}
            </p>
            <p className="text-xs text-stone-600 mt-0.5">
              {outputLabel} output: {fmtBytes(result.outputSize)}
              <span className="ml-2 text-stone-500">{sizeSummary}</span>
            </p>
            {nextStep && (
              <div className="mt-3 border-l-2 border-teal-200 pl-3">
                <p className="text-xs text-stone-500 leading-relaxed">{nextStep.body}</p>
                <a
                  href={nextStep.href}
                  className="mt-1.5 inline-flex text-xs font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                >
                  {nextStep.label} <span aria-hidden="true" className="ml-1">-&gt;</span>
                </a>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onDownload}
            className="w-full sm:w-auto px-4 py-3 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 active:scale-[0.97] transition-all shrink-0 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            Download
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-3 w-full py-3 border border-stone-200 text-stone-600 rounded-xl font-medium text-sm hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
      >
        Convert another
      </button>
    </div>
  );
}
