import { describe, expect, it } from 'vitest';
import { getRouteBySlug } from '../src/data/routes';
import { generatePageHighlights } from '../src/lib/content';

describe('generatePageHighlights', () => {
  it('returns consistent cards for JPEG compress pages', () => {
    const route = getRouteBySlug('compress-jpeg-to-50kb');
    expect(route).toBeDefined();

    const highlights = generatePageHighlights(route!);
    expect(highlights.map((item) => item.title)).toEqual([
      'Best for',
      'Output behavior',
      'Current limits',
    ]);
    expect(highlights[0]?.body).toContain('JPEG');
    expect(highlights[1]?.body).toContain('original file');
    expect(highlights[2]?.body).toContain('exact final size');
  });

  it('returns PNG-specific guidance', () => {
    const route = getRouteBySlug('compress-png-to-200kb');
    expect(route).toBeDefined();

    const highlights = generatePageHighlights(route!);
    expect(highlights[0]?.body).toContain('PNG');
    expect(highlights[1]?.body).toContain('PNG output');
    expect(highlights[2]?.body).toContain('pixel dimensions');
  });

  it('returns resize-to-size guidance', () => {
    const route = getRouteBySlug('resize-image-to-100kb');
    expect(route).toBeDefined();

    const highlights = generatePageHighlights(route!);
    expect(highlights[0]?.body).toContain('100KB');
    expect(highlights[1]?.body).toContain('aspect ratio');
    expect(highlights[2]?.body).toContain('best-effort');
  });

  it('returns platform-page guidance', () => {
    const route = getRouteBySlug('resize-youtube-banner');
    expect(route).toBeDefined();

    const highlights = generatePageHighlights(route!);
    expect(highlights[0]?.body).toContain('YouTube');
    expect(highlights[1]?.body).toContain('exact');
    expect(highlights[2]?.body).toContain('auto-crop');
  });
});
