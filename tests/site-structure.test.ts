import { describe, expect, it } from 'vitest';
import { getRouteBySlug } from '../src/data/routes';
import { getGuideLinksForRoute, getHubForRoute, getRouteBreadcrumbs, listHubInfos } from '../src/lib/site-structure';

describe('site structure helpers', () => {
  it('lists the current guide hubs', () => {
    expect(listHubInfos().map((item) => item.slug)).toEqual([
      'compress-image',
      'resize-image',
      'youtube-image-sizes',
      'signature-tools',
      'image-tools',
    ]);
  });

  it('maps compression routes to the compression guide hub', () => {
    const route = getRouteBySlug('compress-jpeg-to-50kb')!;
    expect(getHubForRoute(route).slug).toBe('compress-image');
  });

  it('maps resize-by-size routes to the resize guide hub', () => {
    const route = getRouteBySlug('resize-image-to-100kb')!;
    expect(getHubForRoute(route).slug).toBe('resize-image');
  });

  it('maps new semantic routes to the expected hubs', () => {
    expect(getHubForRoute(getRouteBySlug('photo-resizer-20kb')!).slug).toBe('resize-image');
    expect(getHubForRoute(getRouteBySlug('compress-jpg-file')!).slug).toBe('compress-image');
    expect(getHubForRoute(getRouteBySlug('resize-png')!).slug).toBe('resize-image');
    expect(getHubForRoute(getRouteBySlug('signature-resizer')!).slug).toBe('signature-tools');
    expect(getHubForRoute(getRouteBySlug('image-splitter')!).slug).toBe('image-tools');
  });

  it('maps YouTube routes to the YouTube guide hub', () => {
    const route = getRouteBySlug('resize-youtube-thumbnail')!;
    expect(getHubForRoute(route).slug).toBe('youtube-image-sizes');
  });

  it('builds a breadcrumb trail ending at the current page', () => {
    const route = getRouteBySlug('compress-png-to-200kb')!;
    const items = getRouteBreadcrumbs(route);
    expect(items[0]).toEqual({ href: '/', label: 'Home' });
    expect(items[2]).toEqual({ href: `/${route.slug}`, label: route.seo.h1 });
  });

  it('adds guide links for the current workflow', () => {
    const route = getRouteBySlug('resize-image-to-2mb')!;
    const links = getGuideLinksForRoute(route);
    expect(links.some((item) => item.href === '/resize-image')).toBe(true);
    expect(links.some((item) => item.href === '/supported-formats')).toBe(true);
  });

  it('adds guide links for semantic workflow pages', () => {
    const jpgLinks = getGuideLinksForRoute(getRouteBySlug('compress-jpg-file')!);
    const pngLinks = getGuideLinksForRoute(getRouteBySlug('resize-png')!);
    expect(jpgLinks.some((item) => item.href === '/compress-image')).toBe(true);
    expect(pngLinks.some((item) => item.href === '/resize-image')).toBe(true);
  });
});
