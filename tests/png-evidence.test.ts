import { describe, expect, it } from 'vitest';
import {
  analyzeTransparency,
  buildEvidenceExport,
  PNG_EVIDENCE_METHOD_VERSION,
  PNG_EVIDENCE_SCHEMA_VERSION,
  signedPercentChange,
} from '../src/lib/png-evidence';
import type { EvidencePatternRun } from '../src/lib/png-evidence';

function rgbaBuffer(pixels: Array<[number, number, number, number]>): Uint8ClampedArray {
  const data = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b, a], i) => {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  });
  return data;
}

const FORBIDDEN_EXPORT_KEYS = [
  'timestamp',
  'userAgent',
  'user_agent',
  'url',
  'filename',
  'imageBytes',
  'canvasData',
  'error',
  'errorMessage',
];

describe('PNG evidence pure calculations', () => {
  it('classifies every pixel into one of three alpha buckets', () => {
    const pixels: Array<[number, number, number, number]> = [
      [0, 0, 0, 0],
      [255, 255, 255, 0],
      [255, 255, 255, 128],
      [0, 0, 0, 1],
      [255, 0, 0, 255],
      [0, 255, 0, 255],
    ];
    const stats = analyzeTransparency(rgbaBuffer(pixels));

    expect(stats.total).toBe(6);
    expect(stats.transparent).toBe(2);
    expect(stats.semiTransparent).toBe(2);
    expect(stats.opaque).toBe(2);
    expect(stats.transparent + stats.semiTransparent + stats.opaque).toBe(stats.total);
  });

  it('reports all-zero alpha as fully transparent and all-255 as fully opaque', () => {
    const transparent = analyzeTransparency(rgbaBuffer([[0, 0, 0, 0]]));
    expect(transparent.transparent).toBe(1);
    expect(transparent.semiTransparent).toBe(0);
    expect(transparent.opaque).toBe(0);
    expect(transparent.transparentPct).toBe(100);

    const opaque = analyzeTransparency(rgbaBuffer([[10, 20, 30, 255]]));
    expect(opaque.transparent).toBe(0);
    expect(opaque.semiTransparent).toBe(0);
    expect(opaque.opaque).toBe(1);
    expect(opaque.opaquePct).toBe(100);
  });

  it('rounds percentages to at most two decimals and returns 0 for an empty buffer', () => {
    const stats = analyzeTransparency(new Uint8ClampedArray(0));
    expect(stats.total).toBe(0);
    expect(stats.transparentPct).toBe(0);
    expect(stats.semiTransparentPct).toBe(0);
    expect(stats.opaquePct).toBe(0);

    const data = rgbaBuffer([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 1],
      [0, 0, 0, 255],
    ]);
    const rounded = analyzeTransparency(data);
    expect(rounded.transparentPct).toBe(50);
    expect(rounded.semiTransparentPct).toBe(25);
    expect(rounded.opaquePct).toBe(25);
    expect(String(rounded.transparentPct)).not.toContain('.');
  });

  it('rejects a buffer whose length is not divisible by four', () => {
    expect(() => analyzeTransparency(new Uint8ClampedArray(5))).toThrow(RangeError);
  });

  it('rounds alpha percentages to at most two decimal places', () => {
    const data = rgbaBuffer([
      [0, 0, 0, 0],
      [0, 0, 0, 128],
      [0, 0, 0, 255],
    ]);
    const stats = analyzeTransparency(data);
    expect(stats.transparentPct).toBe(33.33);
    expect(stats.semiTransparentPct).toBe(33.33);
    expect(stats.opaquePct).toBe(33.33);
    expect(stats.transparentPct + stats.semiTransparentPct + stats.opaquePct).toBeCloseTo(100, 1);
  });

  it('calculates signed byte change and handles zero original size', () => {
    expect(signedPercentChange(1000, 700)).toBe(-30);
    expect(signedPercentChange(1000, 1300)).toBe(30);
    expect(signedPercentChange(1000, 1000)).toBe(0);
    expect(signedPercentChange(0, 500)).toBe(0);
    expect(signedPercentChange(1000, 1234)).toBe(23.4);
    expect(signedPercentChange(1000, 12345)).toBe(1134.5);
  });
});

describe('PNG evidence JSON export', () => {
  const makeRun = (overrides: Partial<EvidencePatternRun> = {}): EvidencePatternRun => ({
    id: 'logo-edges',
    name: 'Binary-alpha logo edges',
    sourceWidth: 480,
    sourceHeight: 320,
    outputWidth: 240,
    outputHeight: 160,
    sourceBytes: 1234,
    outputBytes: 567,
    percentChange: -54.05,
    sourceAlpha: {
      total: 153600,
      transparent: 76800,
      semiTransparent: 0,
      opaque: 76800,
      transparentPct: 50,
      semiTransparentPct: 0,
      opaquePct: 50,
    },
    outputAlpha: {
      total: 38400,
      transparent: 19200,
      semiTransparent: 3840,
      opaque: 15360,
      transparentPct: 50,
      semiTransparentPct: 10,
      opaquePct: 40,
    },
    ...overrides,
  });

  it('exports the fixed schema and method versions with scale and method facts', () => {
    const exportData = buildEvidenceExport(50, [makeRun()]);

    expect(exportData.schemaVersion).toBe(PNG_EVIDENCE_SCHEMA_VERSION);
    expect(exportData.methodVersion).toBe(PNG_EVIDENCE_METHOD_VERSION);
    expect(exportData.scale).toBe(50);
    expect(exportData.method).toEqual({
      name: 'browser-canvas-png-resize',
      smoothingEnabled: true,
      smoothingQuality: 'high',
      encoder: 'canvas-toBlob-png',
    });
  });

  it('includes per-pattern dimensions, bytes, signed change, and alpha counts/percentages', () => {
    const exportData = buildEvidenceExport(25, [makeRun()]);
    const pattern = exportData.patterns[0];

    expect(pattern.sourceWidth).toBe(480);
    expect(pattern.outputHeight).toBe(160);
    expect(pattern.sourceBytes).toBe(1234);
    expect(pattern.outputBytes).toBe(567);
    expect(pattern.percentChange).toBe(-54.05);

    expect(pattern.sourceAlpha).toMatchObject({
      total: 153600,
      transparent: 76800,
      semiTransparent: 0,
      opaque: 76800,
      transparentPct: 50,
      semiTransparentPct: 0,
      opaquePct: 50,
    });

    expect(pattern.outputAlpha.transparent + pattern.outputAlpha.semiTransparent + pattern.outputAlpha.opaque).toBe(
      pattern.outputAlpha.total,
    );
  });

  it('does not include high-cardinality or privacy-sensitive fields', () => {
    const exportData = buildEvidenceExport(50, [
      makeRun({ id: 'text-ui', name: 'Text and UI lines' }),
      makeRun({ id: 'gradient-shadow', name: 'Semi-transparent gradient' }),
    ]);

    const json = JSON.stringify(exportData);
    FORBIDDEN_EXPORT_KEYS.forEach((key) => {
      expect(json).not.toContain(`"${key}"`);
    });
    expect(exportData).not.toHaveProperty('timestamp');
    expect(exportData).not.toHaveProperty('userAgent');
  });

  it('preserves the order and count of the supplied runs', () => {
    const runs = [makeRun({ id: 'a' }), makeRun({ id: 'b' }), makeRun({ id: 'c' })];
    const exportData = buildEvidenceExport(75, runs);
    expect(exportData.patterns.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
});
