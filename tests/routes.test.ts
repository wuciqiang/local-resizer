import { describe, expect, it } from 'vitest';
import {
  PHASE0_SLUGS,
  activeRoutes,
  formatSizeLabel,
  getRouteBySlug,
  parseSize,
  phase0Routes,
} from '../src/data/routes';

describe('parseSize', () => {
  it('parses KB values', () => {
    expect(parseSize('50kb')).toBe(51200);
    expect(parseSize('100kb')).toBe(102400);
    expect(parseSize('1000kb')).toBe(1024000);
  });

  it('parses MB values', () => {
    expect(parseSize('1mb')).toBe(1048576);
    expect(parseSize('2mb')).toBe(2097152);
    expect(parseSize('1.5mb')).toBe(1572864);
  });
});

describe('formatSizeLabel', () => {
  it('formats size labels to uppercase', () => {
    expect(formatSizeLabel('50kb')).toBe('50KB');
    expect(formatSizeLabel('2mb')).toBe('2MB');
  });
});

describe('activeRoutes', () => {
  it('generates only active routes matching PHASE0_SLUGS', () => {
    expect(activeRoutes.length).toBe(PHASE0_SLUGS.length);
    for (const slug of PHASE0_SLUGS) {
      expect(activeRoutes.find((route) => route.slug === slug)).toBeDefined();
    }
  });

  it('includes compress routes for active slugs', () => {
    const compressRoutes = activeRoutes.filter((route) => route.action === 'compress' && route.format);
    expect(compressRoutes.length).toBe(9);
  });

  it('includes resize-image routes for active slugs', () => {
    const resizeRoutes = activeRoutes.filter((route) => route.slug.startsWith('resize-image-to-'));
    expect(resizeRoutes.length).toBe(8);
  });

  it('includes platform routes for active slugs', () => {
    const platformRoutes = activeRoutes.filter((route) => route.platform);
    expect(platformRoutes.length).toBe(8);
    expect(platformRoutes.some((route) => route.slug.includes('gif'))).toBe(false);
  });

  it('includes phase 1 long-tail pages for size, format, and social canvases', () => {
    const phase1Slugs = [
      'compress-image-to-20kb',
      'compress-image-to-500kb',
      'compress-image-to-1mb',
      'compress-image-to-2mb',
      'compress-jpeg-to-20kb',
      'compress-jpeg-to-100kb',
      'compress-jpeg-to-500kb',
      'compress-png-to-50kb',
      'compress-png-to-100kb',
      'resize-image-to-30kb',
      'resize-image-to-150kb',
      'resize-image-to-1mb',
      'resize-instagram-post',
      'resize-instagram-story',
      'resize-facebook-cover',
      'resize-facebook-profile',
      'resize-linkedin-banner',
      'resize-linkedin-profile-photo',
      'batch-resize-images',
    ];

    for (const slug of phase1Slugs) {
      expect(getRouteBySlug(slug)).toBeDefined();
    }
  });

  it('uses focused SEO copy for data-backed target-size opportunities', () => {
    const resize20kb = getRouteBySlug('resize-image-to-20kb');
    const compress500kb = getRouteBySlug('compress-image-to-500kb');

    expect(resize20kb?.seo.title).toContain('Resize Image to 20KB Online Free');
    expect(resize20kb?.seo.description).toContain('Resize image to 20KB online');
    expect(compress500kb?.seo.title).toContain('Compress Image to 500KB Online Free');
    expect(compress500kb?.seo.description).toContain('Compress or convert an image to 500KB');
  });

  it('aligns the PNG resizer snippet with its active query family', () => {
    const resizePng = getRouteBySlug('resize-png');

    expect(resizePng?.seo.title).toContain('Resize PNG Online Free');
    expect(resizePng?.seo.title).toContain('PNG Resizer');
    expect(resizePng?.seo.description).toContain('Resize PNG images online free');
  });

  it('includes explicit semantic routes for active slugs', () => {
    expect(getRouteBySlug('compress-image-to-50kb')?.intent).toBe('generic-compress');
    expect(getRouteBySlug('compress-image-to-100kb')?.intent).toBe('generic-compress');
    expect(getRouteBySlug('compress-image-to-200kb')?.intent).toBe('generic-compress');
    expect(getRouteBySlug('photo-resizer-20kb')?.intent).toBe('document-photo');
    expect(getRouteBySlug('compress-jpg-file')?.intent).toBe('generic-compress');
    expect(getRouteBySlug('resize-png')?.intent).toBe('format-resize');
    expect(getRouteBySlug('batch-resize-images')?.intent).toBe('batch-resize');
    expect(getRouteBySlug('signature-resizer')?.intent).toBe('signature');
    expect(getRouteBySlug('image-splitter')?.intent).toBe('image-splitter');
  });

  it('uses current exact-canvas dimensions for new social platform pages', () => {
    expect(getRouteBySlug('resize-instagram-post')?.dimensions).toEqual({ width: 1080, height: 1080 });
    expect(getRouteBySlug('resize-instagram-story')?.dimensions).toEqual({ width: 1080, height: 1920 });
    expect(getRouteBySlug('resize-facebook-cover')?.dimensions).toEqual({ width: 851, height: 315 });
    expect(getRouteBySlug('resize-facebook-profile')?.dimensions).toEqual({ width: 320, height: 320 });
    expect(getRouteBySlug('resize-linkedin-banner')?.dimensions).toEqual({ width: 1584, height: 396 });
    expect(getRouteBySlug('resize-linkedin-profile-photo')?.dimensions).toEqual({ width: 400, height: 400 });
  });

  it('has unique slugs', () => {
    const slugs = activeRoutes.map((route) => route.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all routes have required SEO and page fields', () => {
    for (const route of activeRoutes) {
      expect(route.seo.title).toBeTruthy();
      expect(route.seo.description).toBeTruthy();
      expect(route.seo.h1).toBeTruthy();
      expect(route.faq.length).toBeGreaterThanOrEqual(5);
      expect(route.howToSteps.length).toBe(3);
      expect(route.acceptFormats.includes('image/gif')).toBe(false);
    }
  });

  it('uses contain mode for current YouTube exact-canvas pages', () => {
    expect(getRouteBySlug('resize-youtube-banner')?.resizeMode).toBe('contain');
    expect(getRouteBySlug('resize-youtube-thumbnail')?.resizeMode).toBe('contain');
    expect(getRouteBySlug('resize-youtube-banner')?.forceCanvasSize).toBe(true);
    expect(getRouteBySlug('resize-youtube-thumbnail')?.forceCanvasSize).toBe(true);
  });
});

describe('getRouteBySlug', () => {
  it('finds existing routes', () => {
    const route = getRouteBySlug('compress-jpeg-to-50kb');
    expect(route).toBeDefined();
    expect(route?.format).toBe('jpeg');
    expect(route?.targetSizeBytes).toBe(51200);
  });

  it('returns explicit semantic routes with expected processor defaults', () => {
    expect(getRouteBySlug('compress-image-to-50kb')?.targetSizeBytes).toBe(50 * 1024);
    expect(getRouteBySlug('compress-image-to-50kb')?.acceptFormats).toEqual(
      expect.arrayContaining(['image/jpeg', 'image/png', 'image/webp']),
    );
    expect(getRouteBySlug('compress-jpg-file')?.lockedAction).toBe('compress');
    expect(getRouteBySlug('compress-jpg-file')?.defaultTargetSizeBytes).toBe(200 * 1024);
    expect(getRouteBySlug('resize-png')?.lockedAction).toBe('resize');
    expect(getRouteBySlug('resize-png')?.defaultDimensions).toEqual({ width: 1280, height: 720 });
    expect(getRouteBySlug('batch-resize-images')?.defaultDimensions).toEqual({ width: 1280, height: 720 });
    expect(getRouteBySlug('batch-resize-images')?.maxFiles).toBe(20);
    expect(getRouteBySlug('batch-resize-images')?.maxBatchSize).toBe(100 * 1024 * 1024);
  });

  it('returns undefined for non-existent slugs', () => {
    expect(getRouteBySlug('nonexistent')).toBeUndefined();
  });
});

describe('phase0Routes', () => {
  it('contains all phase 0 slugs', () => {
    expect(phase0Routes.length).toBe(PHASE0_SLUGS.length);
    for (const slug of PHASE0_SLUGS) {
      expect(phase0Routes.find((route) => route.slug === slug)).toBeDefined();
    }
  });

  it('only links to built phase 0 pages', () => {
    const allowed = new Set(PHASE0_SLUGS);
    for (const route of phase0Routes) {
      for (const relatedSlug of route.relatedLinks) {
        expect(allowed.has(relatedSlug)).toBe(true);
      }
    }
  });

  it('keeps semantic related links for the configurable JPG compressor', () => {
    expect(getRouteBySlug('compress-jpg-file')?.relatedLinks).toEqual(
      expect.arrayContaining([
        'compress-jpeg-to-50kb',
        'compress-jpeg-to-200kb',
        'photo-resizer-20kb',
      ]),
    );
  });

  it('links resize-by-size pages to their nearest size neighbors', () => {
    expect(getRouteBySlug('resize-image-to-30kb')?.relatedLinks).toEqual(
      expect.arrayContaining(['resize-image-to-20kb', 'resize-image-to-50kb']),
    );
    expect(getRouteBySlug('resize-image-to-150kb')?.relatedLinks).toEqual(
      expect.arrayContaining(['resize-image-to-100kb', 'resize-image-to-200kb']),
    );
  });

  it('links compression pages to their nearest size neighbors', () => {
    expect(getRouteBySlug('compress-image-to-100kb')?.relatedLinks).toEqual(
      expect.arrayContaining(['compress-image-to-50kb', 'compress-image-to-200kb']),
    );
    expect(getRouteBySlug('compress-jpeg-to-100kb')?.relatedLinks).toEqual(
      expect.arrayContaining(['compress-jpeg-to-50kb', 'compress-jpeg-to-200kb']),
    );
    expect(getRouteBySlug('compress-png-to-100kb')?.relatedLinks).toEqual(
      expect.arrayContaining(['compress-png-to-50kb', 'compress-png-to-200kb']),
    );
  });

  it('connects the batch page to the resize family and adjacent workflows', () => {
    expect(getRouteBySlug('batch-resize-images')?.relatedLinks).toEqual(
      expect.arrayContaining([
        'resize-png',
        'resize-image-to-100kb',
        'compress-image-to-100kb',
        'image-splitter',
      ]),
    );
    expect(getRouteBySlug('resize-png')?.relatedLinks).toContain('batch-resize-images');
    expect(getRouteBySlug('resize-image-to-100kb')?.relatedLinks).toContain('batch-resize-images');
  });

  it('gives the image splitter a contextual inbound link from the PNG workflow', () => {
    expect(getRouteBySlug('resize-png')?.relatedLinks).toContain('image-splitter');
  });
});
