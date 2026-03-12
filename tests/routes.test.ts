import { describe, it, expect } from 'vitest';
import { parseSize, formatSizeLabel, allRoutes, getRouteBySlug, phase0Routes, PHASE0_SLUGS } from '../src/data/routes';

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

describe('allRoutes', () => {
  it('generates compress routes for all formats and sizes', () => {
    const compressRoutes = allRoutes.filter(r => r.action === 'compress' && r.format);
    expect(compressRoutes.length).toBe(4 * (27 + 7)); // 4 formats × 34 sizes
  });

  it('generates resize-image routes', () => {
    const resizeRoutes = allRoutes.filter(r => r.slug.startsWith('resize-image-to-'));
    expect(resizeRoutes.length).toBe(20);
  });

  it('generates platform routes', () => {
    const platformRoutes = allRoutes.filter(r => r.platform);
    expect(platformRoutes.length).toBe(24);
  });

  it('has unique slugs', () => {
    const slugs = allRoutes.map(r => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all routes have required SEO fields', () => {
    for (const r of allRoutes) {
      expect(r.seo.title).toBeTruthy();
      expect(r.seo.description).toBeTruthy();
      expect(r.seo.h1).toBeTruthy();
      expect(r.faq.length).toBeGreaterThanOrEqual(3);
      expect(r.howToSteps.length).toBe(3);
    }
  });
});

describe('getRouteBySlug', () => {
  it('finds existing routes', () => {
    const route = getRouteBySlug('compress-jpeg-to-50kb');
    expect(route).toBeDefined();
    expect(route!.format).toBe('jpeg');
    expect(route!.targetSizeBytes).toBe(51200);
  });

  it('returns undefined for non-existent slugs', () => {
    expect(getRouteBySlug('nonexistent')).toBeUndefined();
  });
});

describe('phase0Routes', () => {
  it('contains all Phase 0 slugs', () => {
    expect(phase0Routes.length).toBe(PHASE0_SLUGS.length);
    for (const slug of PHASE0_SLUGS) {
      expect(phase0Routes.find(r => r.slug === slug)).toBeDefined();
    }
  });
});
