import { describe, expect, it } from 'vitest';
import { getRouteBySlug } from '../src/data/routes';
import { generateContextSections, generateDetailText, generateIntroText, generatePageHighlights } from '../src/lib/content';

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

  it('returns semantic photo-route guidance', () => {
    const route = getRouteBySlug('photo-resizer-20kb');
    expect(route).toBeDefined();

    const highlights = generatePageHighlights(route!);
    expect(highlights[0]?.body).toContain('20KB');
    expect(highlights[1]?.body).toContain('best-effort');
    expect(highlights[2]?.body).toContain('passport');
  });

  it('returns semantic JPG-route guidance', () => {
    const route = getRouteBySlug('compress-jpg-file');
    expect(route).toBeDefined();

    const highlights = generatePageHighlights(route!);
    expect(highlights[0]?.body).toContain('JPG');
    expect(highlights[1]?.body).toContain('JPEG output');
  });

  it('returns semantic PNG-route guidance', () => {
    const route = getRouteBySlug('resize-png');
    expect(route).toBeDefined();

    const highlights = generatePageHighlights(route!);
    expect(highlights[0]?.body).toContain('PNG');
    expect(highlights[1]?.body).toContain('PNG output');
  });
});

describe('generateIntroText', () => {
  it('keeps compress copy aligned with local-processing claims', () => {
    const route = getRouteBySlug('compress-jpeg-to-200kb');
    expect(route).toBeDefined();

    const intro = generateIntroText(route!);
    expect(intro).toContain('browser');
    expect(intro).toContain('privacy');
  });

  it('keeps resize copy aligned with current static-image scope', () => {
    const route = getRouteBySlug('resize-image-to-20kb');
    expect(route).toBeDefined();

    const intro = generateIntroText(route!);
    expect(intro).toContain('JPEG, PNG, and WebP');
    expect(intro).toContain('aspect ratios');
  });

  it('keeps semantic photo copy aligned with non-official claims', () => {
    const route = getRouteBySlug('photo-resizer-20kb');
    expect(route).toBeDefined();

    const intro = generateIntroText(route!);
    const detail = generateDetailText(route!);
    expect(intro).toContain('20KB');
    expect(detail).toContain('best-effort');
    expect(detail).toContain('not an official');
  });

  it('keeps semantic JPG and PNG copy aligned with local browser claims', () => {
    const jpgRoute = getRouteBySlug('compress-jpg-file');
    const pngRoute = getRouteBySlug('resize-png');
    expect(jpgRoute).toBeDefined();
    expect(pngRoute).toBeDefined();

    expect(generateIntroText(jpgRoute!)).toContain('browser');
    expect(generateDetailText(jpgRoute!)).toContain('best-effort');
    expect(generateIntroText(pngRoute!)).toContain('PNG');
    expect(generateDetailText(pngRoute!)).toContain('transparency');
  });
});

describe('generateDetailText', () => {
  it('describes exact-canvas behavior for platform pages', () => {
    const route = getRouteBySlug('resize-youtube-thumbnail');
    expect(route).toBeDefined();

    const detail = generateDetailText(route!);
    expect(detail).toContain('padding');
    expect(detail).toContain('without distortion');
  });
});

describe('generateContextSections', () => {
  it('returns size-specific context for strict JPEG workflows', () => {
    const route = getRouteBySlug('compress-jpeg-to-50kb');
    expect(route).toBeDefined();

    const sections = generateContextSections(route!);
    expect(sections).toHaveLength(3);
    expect(sections[0]?.body).toContain('strict upload gates');
    expect(sections[2]?.body).toContain('200KB page');
  });

  it('returns PNG-specific context for PNG workflows', () => {
    const route = getRouteBySlug('compress-png-to-200kb');
    expect(route).toBeDefined();

    const sections = generateContextSections(route!);
    expect(sections[0]?.body).toContain('stay PNG');
    expect(sections[1]?.body).toContain('reduce pixel dimensions');
  });

  it('returns comparison guidance for resize-by-size routes', () => {
    const route = getRouteBySlug('resize-image-to-20kb');
    expect(route).toBeDefined();

    const sections = generateContextSections(route!);
    expect(sections[0]?.body).toContain('strict upload limits');
    expect(sections[2]?.body).toContain('100KB page');
  });

  it('returns platform-specific context for YouTube pages', () => {
    const route = getRouteBySlug('resize-youtube-banner');
    expect(route).toBeDefined();

    const sections = generateContextSections(route!);
    expect(sections[0]?.body).toContain('exact 2560 x 1440 canvas');
    expect(sections[2]?.body).toContain('thumbnail page');
  });

  it('returns semantic context for the new route intents', () => {
    const photoSections = generateContextSections(getRouteBySlug('photo-resizer-20kb')!);
    const jpgSections = generateContextSections(getRouteBySlug('compress-jpg-file')!);
    const pngSections = generateContextSections(getRouteBySlug('resize-png')!);

    expect(photoSections[0]?.body).toContain('strict photo-upload');
    expect(jpgSections[0]?.body).toContain('JPG');
    expect(pngSections[0]?.body).toContain('PNG');
  });
});
