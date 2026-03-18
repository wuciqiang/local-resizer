import { DIMENSION_PRESETS, SIZE_PRESETS } from './presets';
import { tabClass } from './utils';

interface ConfigPanelProps {
  heightValue: string;
  processorHint: string;
  sizeUnit: 'kb' | 'mb';
  sizeValue: string;
  toolAction: 'compress' | 'resize';
  widthValue: string;
  onHeightChange: (value: string) => void;
  onSizeUnitChange: (value: 'kb' | 'mb') => void;
  onSizeValueChange: (value: string) => void;
  onToolActionChange: (value: 'compress' | 'resize') => void;
  onWidthChange: (value: string) => void;
}

export function ConfigPanel({
  heightValue,
  processorHint,
  sizeUnit,
  sizeValue,
  toolAction,
  widthValue,
  onHeightChange,
  onSizeUnitChange,
  onSizeValueChange,
  onToolActionChange,
  onWidthChange,
}: ConfigPanelProps) {
  return (
    <div className="mt-5 bg-white rounded-2xl border border-stone-200 shadow-soft p-5 animate-fade-up">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={tabClass(toolAction === 'compress')}
          onClick={() => onToolActionChange('compress')}
        >
          Compress
        </button>
        <button
          type="button"
          className={tabClass(toolAction === 'resize')}
          onClick={() => onToolActionChange('resize')}
        >
          Resize
        </button>
      </div>

      {toolAction === 'compress' && (
        <div>
          <label htmlFor="target-size-input" className="block text-sm font-medium text-stone-800 mb-2">
            Target file size
          </label>
          <div className="flex gap-2">
            <input
              id="target-size-input"
              type="number"
              min="1"
              value={sizeValue}
              onChange={(event) => onSizeValueChange(event.target.value)}
              className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              placeholder="e.g. 200"
              aria-label="Target file size value"
            />
            <label htmlFor="size-unit-select" className="sr-only">File size unit</label>
            <select
              id="size-unit-select"
              value={sizeUnit}
              onChange={(event) => onSizeUnitChange(event.target.value as 'kb' | 'mb')}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              aria-label="File size unit (KB or MB)"
            >
              <option value="kb">KB</option>
              <option value="mb">MB</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {SIZE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onSizeValueChange(preset.value);
                  onSizeUnitChange(preset.unit);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-50 border border-stone-200 text-stone-700 hover:border-teal-500 hover:text-teal-700 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {toolAction === 'resize' && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Output dimensions (px)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              value={widthValue}
              onChange={(event) => onWidthChange(event.target.value)}
              className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Width"
            />
            <span className="text-stone-500 text-sm">x</span>
            <input
              type="number"
              min="1"
              value={heightValue}
              onChange={(event) => onHeightChange(event.target.value)}
              className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Height"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {DIMENSION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onWidthChange(String(preset.width));
                  onHeightChange(String(preset.height));
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-50 border border-stone-200 text-stone-700 hover:border-teal-500 hover:text-teal-700 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-stone-500">{processorHint}</p>
    </div>
  );
}
