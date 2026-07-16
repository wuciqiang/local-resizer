export const PNG_EVIDENCE_SCHEMA_VERSION = '1.0.0';
export const PNG_EVIDENCE_METHOD_VERSION = '1.0.0';

export interface AlphaStats {
  total: number;
  transparent: number;
  semiTransparent: number;
  opaque: number;
  transparentPct: number;
  semiTransparentPct: number;
  opaquePct: number;
}

export interface EvidencePatternRun {
  id: string;
  name: string;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  sourceBytes: number;
  outputBytes: number;
  percentChange: number;
  sourceAlpha: AlphaStats;
  outputAlpha: AlphaStats;
}

export interface EvidenceExport {
  schemaVersion: string;
  methodVersion: string;
  scale: number;
  method: {
    name: string;
    smoothingEnabled: boolean;
    smoothingQuality: string;
    encoder: string;
  };
  patterns: EvidencePatternRun[];
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function analyzeTransparency(data: Uint8ClampedArray): AlphaStats {
  if (data.length % 4 !== 0) {
    throw new RangeError('RGBA buffer length must be divisible by 4.');
  }

  const total = data.length / 4;
  let transparent = 0;
  let semiTransparent = 0;
  let opaque = 0;

  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i];
    if (alpha === 0) {
      transparent += 1;
    } else if (alpha === 255) {
      opaque += 1;
    } else {
      semiTransparent += 1;
    }
  }

  const pct = (count: number) => (total > 0 ? round2((count / total) * 100) : 0);

  return {
    total,
    transparent,
    semiTransparent,
    opaque,
    transparentPct: pct(transparent),
    semiTransparentPct: pct(semiTransparent),
    opaquePct: pct(opaque),
  };
}

export function signedPercentChange(original: number, current: number): number {
  if (original === 0 || !Number.isFinite(original)) return 0;
  return round2(((current - original) / original) * 100);
}

export function buildEvidenceExport(
  scale: number,
  runs: EvidencePatternRun[],
): EvidenceExport {
  return {
    schemaVersion: PNG_EVIDENCE_SCHEMA_VERSION,
    methodVersion: PNG_EVIDENCE_METHOD_VERSION,
    scale,
    method: {
      name: 'browser-canvas-png-resize',
      smoothingEnabled: true,
      smoothingQuality: 'high',
      encoder: 'canvas-toBlob-png',
    },
    patterns: runs,
  };
}
