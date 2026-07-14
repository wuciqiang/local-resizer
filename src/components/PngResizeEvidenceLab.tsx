import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { trackToolEvent } from '../lib/analytics';
import {
  analyzeTransparency,
  buildEvidenceExport,
  PNG_EVIDENCE_METHOD_VERSION,
  PNG_EVIDENCE_SCHEMA_VERSION,
  signedPercentChange,
} from '../lib/png-evidence';
import type { AlphaStats, EvidencePatternRun } from '../lib/png-evidence';

type Scale = 75 | 50 | 25;

interface Pattern {
  id: string;
  name: string;
  description: string;
  sourceWidth: number;
  sourceHeight: number;
}

interface PatternRun {
  id: string;
  sourceBlob: Blob;
  outputBlob: Blob;
  sourceCanvas: HTMLCanvasElement;
  outputCanvas: HTMLCanvasElement;
  sourceBytes: number;
  outputBytes: number;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  sourceAlpha: AlphaStats;
  outputAlpha: AlphaStats;
  percentChange: number;
  scale: Scale;
}

type LabStatus = 'idle' | 'loading' | 'ready' | 'error';

const SCALES: Scale[] = [75, 50, 25];

const PATTERNS: Pattern[] = [
  {
    id: 'logo-edges',
    name: 'Binary-alpha logo edges',
    description:
      'Pixel-aligned opaque shapes on a transparent background, so the source alpha channel contains only 0 and 255 values.',
    sourceWidth: 480,
    sourceHeight: 320,
  },
  {
    id: 'text-ui',
    name: 'Text and UI lines',
    description:
      'Small text, horizontal rules, and a card-like rectangle as in a screenshot or interface element.',
    sourceWidth: 480,
    sourceHeight: 320,
  },
  {
    id: 'gradient-shadow',
    name: 'Semi-transparent gradient',
    description:
      'A soft shadow and an alpha gradient to show how partial transparency survives resizing.',
    sourceWidth: 480,
    sourceHeight: 320,
  },
  {
    id: 'fine-line-art',
    name: 'Fine line art',
    description:
      'Thin diagonal strokes and a hairline grid that are sensitive to pixel resampling.',
    sourceWidth: 480,
    sourceHeight: 320,
  },
];

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }
  return ctx;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPattern(
  patternId: string,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);

  switch (patternId) {
    case 'logo-edges': {
      ctx.fillStyle = '#0d9488';
      ctx.fillRect(67, 59, 137, 91);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(253, 83, 121, 73);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(109, 211, 241, 5);
      break;
    }

    case 'text-ui': {
      const cardX = 24;
      const cardY = 24;
      const cardW = width - 48;
      const cardH = height - 48;

      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, cardX, cardY, cardW, cardH, 16);
      ctx.fill();

      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 28px Inter, "Segoe UI", sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Resize PNG', cardX + 20, cardY + 20);

      ctx.font = '16px Inter, "Segoe UI", sans-serif';
      ctx.fillStyle = '#57534e';
      ctx.fillText('Transparent pixels stay clear.', cardX + 20, cardY + 60);

      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cardX + 20, cardY + 96);
      ctx.lineTo(cardX + cardW - 20, cardY + 96);
      ctx.stroke();

      ctx.fillStyle = '#0d9488';
      roundRectPath(ctx, cardX + 20, cardY + 116, 160, 44, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Inter, "Segoe UI", sans-serif';
      ctx.fillText('Button', cardX + 60, cardY + 128);
      break;
    }

    case 'gradient-shadow': {
      const boxX = width * 0.2;
      const boxY = height * 0.2;
      const boxW = width * 0.6;
      const boxH = height * 0.5;

      const shadowGradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.55,
        8,
        width * 0.5,
        height * 0.55,
        width * 0.45,
      );
      shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGradient;
      ctx.fillRect(0, 0, width, height);

      const fillGradient = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
      fillGradient.addColorStop(0, 'rgba(13, 148, 136, 0.95)');
      fillGradient.addColorStop(1, 'rgba(13, 148, 136, 0.55)');
      ctx.fillStyle = fillGradient;
      roundRectPath(ctx, boxX, boxY, boxW, boxH, 16);
      ctx.fill();
      break;
    }

    case 'fine-line-art': {
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#0d9488';
      for (let i = -height; i < width; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, height);
        ctx.lineTo(i + height, 0);
        ctx.stroke();
      }

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, 80, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    default:
      break;
  }
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas produced an empty PNG blob.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

const CHECKERBOARD_STYLE = {
  backgroundImage:
    'linear-gradient(45deg, #e7e5e4 25%, transparent 25%), linear-gradient(-45deg, #e7e5e4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e7e5e4 75%), linear-gradient(-45deg, transparent 75%, #e7e5e4 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
  backgroundColor: '#fafaf9',
} as const;

interface CanvasPreviewProps {
  source: HTMLCanvasElement;
  label: string;
  displayWidthPercent: number;
}

function CanvasPreview({ source, label, displayWidthPercent }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (canvas.width !== source.width || canvas.height !== source.height) {
        canvas.width = source.width;
        canvas.height = source.height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context is not available.');
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0);
      setHasError(false);
    } catch {
      setHasError(true);
    }
  }, [source]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-label={label}
        role="img"
        aria-hidden={hasError}
        style={{
          display: hasError ? 'none' : 'block',
          width: `${displayWidthPercent}%`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
      {hasError && (
        <div
          role="status"
          aria-live="polite"
          className="text-sm text-stone-500 text-center px-4"
        >
          Canvas preview unavailable in this browser. The measured metrics below
          still reflect the generated PNG.
        </div>
      )}
    </>
  );
}

export default function PngResizeEvidenceLab() {
  const [scale, setScale] = useState<Scale>(50);
  const [runs, setRuns] = useState<PatternRun[]>([]);
  const [status, setStatus] = useState<LabStatus>('idle');
  const [error, setError] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const generationRef = useRef(0);
  const downloadUrlsRef = useRef<string[]>([]);

  const revokeAllDownloads = useCallback(() => {
    for (const url of downloadUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    downloadUrlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      revokeAllDownloads();
    };
  }, [revokeAllDownloads]);

  const runLab = useCallback(
    async (targetScale: Scale) => {
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      setStatus('loading');
      setError('');
      setStatusMessage(`Resizing test patterns to ${targetScale}% scale.`);

      try {
        const nextRuns: PatternRun[] = [];

        for (const pattern of PATTERNS) {
          const sourceCanvas = createCanvas(pattern.sourceWidth, pattern.sourceHeight);
          const sourceCtx = getContext(sourceCanvas);
          drawPattern(pattern.id, sourceCtx, pattern.sourceWidth, pattern.sourceHeight);

          const sourceBlob = await canvasToPngBlob(sourceCanvas);

          const sourceImageData = sourceCtx.getImageData(
            0,
            0,
            pattern.sourceWidth,
            pattern.sourceHeight,
          );
          const sourceAlpha = analyzeTransparency(sourceImageData.data);

          const outputWidth = Math.round(pattern.sourceWidth * (targetScale / 100));
          const outputHeight = Math.round(pattern.sourceHeight * (targetScale / 100));
          const outputCanvas = createCanvas(outputWidth, outputHeight);
          const outputCtx = getContext(outputCanvas);

          outputCtx.imageSmoothingEnabled = true;
          outputCtx.imageSmoothingQuality = 'high';
          outputCtx.drawImage(sourceCanvas, 0, 0, outputWidth, outputHeight);

          const outputBlob = await canvasToPngBlob(outputCanvas);

          const outputImageData = outputCtx.getImageData(0, 0, outputWidth, outputHeight);
          const outputAlpha = analyzeTransparency(outputImageData.data);

          nextRuns.push({
            id: pattern.id,
            sourceBlob,
            outputBlob,
            sourceCanvas,
            outputCanvas,
            sourceBytes: sourceBlob.size,
            outputBytes: outputBlob.size,
            sourceWidth: pattern.sourceWidth,
            sourceHeight: pattern.sourceHeight,
            outputWidth,
            outputHeight,
            sourceAlpha,
            outputAlpha,
            percentChange: signedPercentChange(sourceBlob.size, outputBlob.size),
            scale: targetScale,
          });
        }

        if (generationRef.current !== generation) {
          return;
        }

        setRuns(nextRuns);
        setStatus('ready');
        setStatusMessage(
          `Test patterns resized to ${targetScale}% scale. Results shown below.`,
        );
        trackToolEvent('evidence_lab_completed', {
          tool_name: 'png_evidence_lab',
          tool_action: 'run_evidence_lab',
          result_type: 'completed',
          option_group: 'scale',
          option_value: String(targetScale),
        });
      } catch (err) {
        if (generationRef.current !== generation) {
          return;
        }
        setRuns([]);
        setStatus('error');
        setError(
          err instanceof Error
            ? err.message
            : 'The evidence lab failed to generate PNG samples.',
        );
        setStatusMessage('Error: the evidence lab could not generate PNG samples.');
        trackToolEvent('process_failed', {
          tool_name: 'png_evidence_lab',
          tool_action: 'generate_patterns',
          result_type: 'error',
          error_type: 'generation_failed',
        });
      }
    },
    [],
  );

  useEffect(() => {
    runLab(scale);
  }, [scale, runLab]);

  const handleScaleChange = useCallback(
    (nextScale: Scale) => {
      if (nextScale !== scale) {
        trackToolEvent('tool_option_select', {
          tool_name: 'png_evidence_lab',
          tool_action: 'scale_select',
          result_type: 'select',
          option_group: 'scale',
          option_value: String(nextScale),
        });
      }
      setScale(nextScale);
    },
    [scale],
  );

  const trackAndDownload = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    downloadUrlsRef.current.push(url);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      downloadUrlsRef.current = downloadUrlsRef.current.filter((u) => u !== url);
    }, 1000);
  }, []);

  const downloadSource = useCallback(
    (run: PatternRun) => {
      trackToolEvent('download_result', {
        tool_name: 'png_evidence_lab',
        tool_action: 'download_source_png',
        result_type: 'source_png',
      });
      trackAndDownload(run.sourceBlob, `localresizer-png-source-${run.id}.png`);
    },
    [trackAndDownload],
  );

  const downloadOutput = useCallback(
    (run: PatternRun) => {
      trackToolEvent('download_result', {
        tool_name: 'png_evidence_lab',
        tool_action: 'download_resized_png',
        result_type: 'resized_png',
      });
      trackAndDownload(
        run.outputBlob,
        `localresizer-png-resized-${run.id}-${run.scale}pct.png`,
      );
    },
    [trackAndDownload],
  );

  const evidenceExport = useMemo<EvidencePatternRun[] | null>(() => {
    if (runs.length === 0) return null;
    return runs.map((run) => {
      const pattern = PATTERNS.find((p) => p.id === run.id);
      return {
        id: run.id,
        name: pattern?.name ?? run.id,
        sourceWidth: run.sourceWidth,
        sourceHeight: run.sourceHeight,
        outputWidth: run.outputWidth,
        outputHeight: run.outputHeight,
        sourceBytes: run.sourceBytes,
        outputBytes: run.outputBytes,
        percentChange: run.percentChange,
        sourceAlpha: run.sourceAlpha,
        outputAlpha: run.outputAlpha,
      };
    });
  }, [runs]);

  const downloadJson = useCallback(() => {
    if (!evidenceExport) return;
    const exportData = buildEvidenceExport(scale, evidenceExport);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    trackToolEvent('download_result', {
      tool_name: 'png_evidence_lab',
      tool_action: 'download_json_report',
      result_type: 'json',
    });
    trackAndDownload(blob, `localresizer-png-evidence-${scale}pct.json`);
  }, [evidenceExport, scale, trackAndDownload]);

  return (
    <section className="space-y-6" aria-label="PNG resize transparency evidence lab">
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-stone-100">
        <h3 className="font-[var(--font-heading)] text-lg font-semibold text-stone-900 mb-3">
          Scale control
        </h3>
        <p className="text-sm text-stone-500 leading-relaxed mb-4">
          Choose a downscale percentage. Every pattern is regenerated at the selected size, and
          metrics are read from the current browser&apos;s PNG encoder.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Resize scale">
          {SCALES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleScaleChange(s)}
              aria-pressed={scale === s}
              className={[
                'px-4 py-2 rounded-xl text-sm font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                scale === s
                  ? 'bg-teal-700 border-teal-700 text-white shadow-soft'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-teal-300 hover:text-teal-700',
              ].join(' ')}
            >
              {s}%
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-4">
          Schema {PNG_EVIDENCE_SCHEMA_VERSION} | Method {PNG_EVIDENCE_METHOD_VERSION} |{' '}
          <a
            href="https://github.com/wuciqiang/local-resizer/blob/main/src/components/PngResizeEvidenceLab.tsx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 hover:text-teal-800 underline underline-offset-2"
          >
            Source code
          </a>
        </p>
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-3 p-5 bg-stone-50 rounded-2xl border border-stone-100 text-stone-600">
          <span
            className="inline-block w-5 h-5 border-2 border-stone-300 border-t-teal-600 rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm">
            Generating PNG patterns and measuring browser output at {scale}% scale...
          </span>
        </div>
      )}

      {status === 'error' && (
        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
          <p className="font-medium mb-1">The lab could not generate samples.</p>
          <p>{error}</p>
        </div>
      )}

      {runs.length > 0 && status !== 'error' && (
        <div className="space-y-8" aria-busy={status === 'loading'}>
          {status === 'ready' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={downloadJson}
                className="inline-flex items-center px-4 py-2 bg-white border border-stone-200 text-stone-600 text-sm font-medium rounded-xl hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                Download JSON report
              </button>
            </div>
          )}

          {runs.map((run) => {
            const pattern = PATTERNS.find((p) => p.id === run.id);
            if (!pattern) return null;

            return (
              <article
                key={run.id}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-soft border border-stone-100"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-[var(--font-heading)] font-semibold text-stone-900">
                      {pattern.name}
                    </h3>
                    <p className="text-sm text-stone-500">{pattern.description}</p>
                  </div>
                  <div className="text-sm text-stone-500">
                    Byte change:{" "}
                    <span
                      className={
                        run.percentChange > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }
                    >
                      {run.percentChange > 0 ? '+' : ''}
                      {run.percentChange}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                      Source PNG
                    </p>
                    <div
                      className="flex items-center justify-center w-full rounded-xl border border-stone-200 overflow-hidden"
                      style={{ ...CHECKERBOARD_STYLE, aspectRatio: '3 / 2' }}
                    >
                      <CanvasPreview
                        source={run.sourceCanvas}
                        label={`Source PNG for ${pattern.name}`}
                        displayWidthPercent={100}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                      Resized PNG ({run.scale}%)
                    </p>
                    <div
                      className="flex items-center justify-center w-full rounded-xl border border-stone-200 overflow-hidden"
                      style={{ ...CHECKERBOARD_STYLE, aspectRatio: '3 / 2' }}
                    >
                      <CanvasPreview
                        source={run.outputCanvas}
                        label={`Resized PNG for ${pattern.name} at ${run.scale}% scale`}
                        displayWidthPercent={run.scale}
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <caption className="caption-bottom text-left text-xs text-stone-400 mt-2 mb-2">
                      {pattern.name}: source and resized transparency and byte metrics.
                    </caption>
                    <thead className="text-xs text-stone-500 uppercase bg-stone-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 rounded-tl-lg">Property</th>
                        <th scope="col" className="px-3 py-2">Source</th>
                        <th scope="col" className="px-3 py-2 rounded-tr-lg">Resized ({run.scale}%)</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone-600">
                      <tr className="border-t border-stone-100">
                        <th scope="row" className="px-3 py-2 font-normal">Dimensions</th>
                        <td className="px-3 py-2">
                          {run.sourceWidth} x {run.sourceHeight}px
                        </td>
                        <td className="px-3 py-2">
                          {run.outputWidth} x {run.outputHeight}px
                        </td>
                      </tr>
                      <tr className="border-t border-stone-100">
                        <th scope="row" className="px-3 py-2 font-normal">PNG bytes</th>
                        <td className="px-3 py-2">{formatBytes(run.sourceBytes)}</td>
                        <td className="px-3 py-2">
                          {formatBytes(run.outputBytes)} ({run.percentChange > 0 ? '+' : ''}
                          {run.percentChange}%)
                        </td>
                      </tr>
                      <tr className="border-t border-stone-100">
                        <th scope="row" className="px-3 py-2 font-normal">Fully transparent pixels</th>
                        <td className="px-3 py-2">
                          {run.sourceAlpha.transparent} ({run.sourceAlpha.transparentPct}%)
                        </td>
                        <td className="px-3 py-2">
                          {run.outputAlpha.transparent} ({run.outputAlpha.transparentPct}%)
                        </td>
                      </tr>
                      <tr className="border-t border-stone-100">
                        <th scope="row" className="px-3 py-2 font-normal">Semi-transparent pixels</th>
                        <td className="px-3 py-2">
                          {run.sourceAlpha.semiTransparent} ({run.sourceAlpha.semiTransparentPct}%)
                        </td>
                        <td className="px-3 py-2">
                          {run.outputAlpha.semiTransparent} ({run.outputAlpha.semiTransparentPct}%)
                        </td>
                      </tr>
                      <tr className="border-t border-stone-100">
                        <th scope="row" className="px-3 py-2 font-normal">Fully opaque pixels</th>
                        <td className="px-3 py-2">
                          {run.sourceAlpha.opaque} ({run.sourceAlpha.opaquePct}%)
                        </td>
                        <td className="px-3 py-2">
                          {run.outputAlpha.opaque} ({run.outputAlpha.opaquePct}%)
                        </td>
                      </tr>
                      <tr className="border-t border-stone-100">
                        <th scope="row" className="px-3 py-2 font-normal">Total pixels</th>
                        <td className="px-3 py-2">{run.sourceAlpha.total.toLocaleString()}</td>
                        <td className="px-3 py-2">{run.outputAlpha.total.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => downloadSource(run)}
                    className="inline-flex items-center px-4 py-2 bg-white border border-stone-200 text-stone-600 text-sm font-medium rounded-xl hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                  >
                    Download source PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadOutput(run)}
                    className="inline-flex items-center px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-xl hover:bg-teal-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                  >
                    Download resized PNG
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
