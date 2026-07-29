interface ConvertConfigBarProps {
  outputLabel: string;
  showQuality: boolean;
  showBackground: boolean;
  quality: number;
  backgroundColor: string;
  onQualityChange: (value: number) => void;
  onBackgroundChange: (value: string) => void;
}

export function ConvertConfigBar({
  outputLabel,
  showQuality,
  showBackground,
  quality,
  backgroundColor,
  onQualityChange,
  onBackgroundChange,
}: ConvertConfigBarProps) {
  return (
    <div className="mb-3 flex flex-col gap-4 rounded-xl border border-stone-100 bg-stone-50/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
          {outputLabel} output
        </span>
        {!showQuality && !showBackground && (
          <span className="text-xs text-stone-500">
            Original pixel dimensions are kept. PNG output has no quality setting and may be larger than the source.
          </span>
        )}
      </div>

      {showQuality && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="converter-quality-input" className="text-sm font-medium text-stone-800">
              JPEG quality
            </label>
            <output
              htmlFor="converter-quality-input"
              className="text-sm font-semibold text-teal-700 tabular-nums"
            >
              {quality}
            </output>
          </div>
          <div className="py-2">
            <input
              id="converter-quality-input"
              name="converter-quality"
              type="range"
              min="1"
              max="100"
              step="1"
              value={quality}
              onChange={(event) => onQualityChange(Number(event.target.value))}
              aria-valuetext={`${quality} out of 100`}
            className="w-full py-2 accent-teal-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Higher keeps more detail and a larger file. It is not a file-size target.
          </p>
        </div>
      )}

      {showBackground && (
        <div className="flex items-center gap-3">
          <input
            id="converter-background-input"
            name="converter-background"
            type="color"
            value={backgroundColor}
            onChange={(event) => onBackgroundChange(event.target.value)}
            aria-label="Background color for transparent areas"
            className="w-10 h-10 shrink-0 rounded-lg border border-stone-200 bg-white p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          />
          <div className="min-w-0">
            <label htmlFor="converter-background-input" className="block text-sm font-medium text-stone-800">
              Background for transparent areas
            </label>
            <p className="text-xs text-stone-500">
              JPG has no transparency. Transparent pixels are filled with this color.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
