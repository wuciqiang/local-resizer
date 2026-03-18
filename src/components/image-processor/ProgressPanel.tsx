interface ProgressPanelProps {
  progress: number;
}

export function ProgressPanel({ progress }: ProgressPanelProps) {
  return (
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
  );
}
