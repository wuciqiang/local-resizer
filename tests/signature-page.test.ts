import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const signatureProcessorPath = resolve(process.cwd(), 'src/components/SignatureProcessor.tsx');

describe('signature resizer safeguards', () => {
  it('does not send PNG output through png-scale compression', () => {
    const source = readFileSync(signatureProcessorPath, 'utf8');

    expect(source.includes("pngStrategy: outputMode === 'png' ? 'png-scale' : 'auto'")).toBe(false);
    expect(source.includes("outputMode === 'png'")).toBe(true);
    expect(source.includes('Kept the exact PNG dimensions')).toBe(true);
  });

  it('uses single-file upload messaging for the signature workflow', () => {
    const source = readFileSync(signatureProcessorPath, 'utf8');

    expect(source.includes('multiple={false}')).toBe(true);
    expect(source.includes('fileCountLabel="1 signature image only"')).toBe(true);
    expect(source.includes('Trim preview')).toBe(true);
  });

  it('ignores rejected trim previews after a newer request takes ownership', () => {
    const source = readFileSync(signatureProcessorPath, 'utf8');

    expect(source).toMatch(
      /catch \(error\) \{[\s\S]*?requestId !== previewRequestRef\.current[\s\S]*?return undefined;[\s\S]*?throw error;/,
    );
    expect(source.includes('if (previewResult === null)')).toBe(true);
    expect(source.includes("await refreshTrimPreview();\n                    setError('');")).toBe(false);
  });

  it('can rebuild the preview immediately after trim is re-enabled', () => {
    const source = readFileSync(signatureProcessorPath, 'utf8');

    expect(source.includes('if (!file || !trimWhitespace)')).toBe(false);
    expect(source).toMatch(/const refreshTrimPreview = useCallback\(async \(\) => \{\s+if \(!file\)/);
  });
});
