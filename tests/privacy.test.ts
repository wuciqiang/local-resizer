import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('analytics privacy disclosures', () => {
  it('discloses the analytics services that production currently loads', () => {
    const privacy = read('src/pages/privacy.astro');

    expect(privacy).toContain('Google Analytics 4');
    expect(privacy).toContain('Microsoft Clarity');
    expect(privacy).toContain('Umami');
    expect(privacy).not.toContain('in the future');
  });

  it('masks user file names and processing errors from Clarity recordings', () => {
    for (const relativePath of [
      'src/components/ImageProcessor.tsx',
      'src/components/ImageSplitterProcessor.tsx',
      'src/components/ImageConverterProcessor.tsx',
      'src/components/SignatureProcessor.tsx',
      'src/components/image-converter/ConvertResultPanel.tsx',
      'src/components/image-processor/ResultsPanel.tsx',
      'src/components/image-processor/SelectedFilesPanel.tsx',
    ]) {
      expect(read(relativePath)).toContain('data-clarity-mask="true"');
    }

    expect(read('src/components/SignatureProcessor.tsx')).toContain('<img data-clarity-mask="true"');
    expect(read('src/components/ImageSplitterProcessor.tsx')).toContain('<img data-clarity-mask="true"');
  });

  it('masks every converter image preview from Clarity recordings', () => {
    for (const relativePath of [
      'src/components/ImageConverterProcessor.tsx',
      'src/components/image-converter/ConvertResultPanel.tsx',
    ]) {
      const imageTags = read(relativePath).match(/<img\b[\s\S]*?\/>/g) ?? [];

      expect(imageTags.length).toBeGreaterThan(0);
      for (const imageTag of imageTags) {
        expect(imageTag).toContain('data-clarity-mask="true"');
      }
    }
  });
});
