import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyticsPageId } from '../src/lib/analytics';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('analytics page identity contract', () => {
  it('uses stable hyphenated page ids', () => {
    expect(analyticsPageId('/')).toBe('home');
    expect(analyticsPageId('/resize-image/')).toBe('resize-image');
    expect(analyticsPageId('/resize-png/')).toBe('resize-png');
    expect(analyticsPageId('/compress-image/')).toBe('compress-image');
  });

  it('maps related page clicks from the current page to the target page', () => {
    const source = readFileSync(resolve(projectRoot, 'src/layouts/BaseLayout.astro'), 'utf8');
    expect(source).toMatch(
      /lrTrackEvent\(['"]related_page_click['"],\s*\{[\s\S]{0,500}?from_page:\s*analyticsPageId\(\),[\s\S]{0,500}?result_type:\s*analyticsPageId\(targetUrl\.pathname\)/,
    );
  });
});
