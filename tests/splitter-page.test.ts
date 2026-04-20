import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const splitterProcessorPath = resolve(process.cwd(), 'src/components/ImageSplitterProcessor.tsx');

describe('image splitter page safeguards', () => {
  it('uses single-file upload messaging for the splitter workflow', () => {
    const source = readFileSync(splitterProcessorPath, 'utf8');

    expect(source.includes('multiple={false}')).toBe(true);
    expect(source.includes('fileCountLabel="1 image only"')).toBe(true);
  });

  it('renders a visible split preview grid before processing', () => {
    const source = readFileSync(splitterProcessorPath, 'utf8');

    expect(source.includes('Split preview')).toBe(true);
    expect(source.includes('getSplitRects(')).toBe(true);
    expect(source.includes('Image split preview')).toBe(true);
  });
});
