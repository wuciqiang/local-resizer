import { describe, it, expect } from 'vitest';
import { generateHowToSchema, generateFAQSchema, generateBreadcrumbSchema, generateCanonicalUrl } from '../src/lib/seo';
import { getRouteBySlug } from '../src/data/routes';
import { getRouteBreadcrumbs } from '../src/lib/site-structure';

describe('generateHowToSchema', () => {
  it('generates valid HowTo schema', () => {
    const route = getRouteBySlug('compress-jpeg-to-50kb')!;
    const schema = generateHowToSchema(route) as any;
    expect(schema['@type']).toBe('HowTo');
    expect(schema.step).toHaveLength(3);
    expect(schema.step[0].position).toBe(1);
  });
});

describe('generateFAQSchema', () => {
  it('generates valid FAQPage schema', () => {
    const route = getRouteBySlug('compress-jpeg-to-50kb')!;
    const schema = generateFAQSchema(route) as any;
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity.length).toBeGreaterThanOrEqual(3);
    expect(schema.mainEntity[0]['@type']).toBe('Question');
  });
});

describe('generateBreadcrumbSchema', () => {
  it('generates valid BreadcrumbList schema', () => {
    const route = getRouteBySlug('compress-jpeg-to-50kb')!;
    const schema = generateBreadcrumbSchema(getRouteBreadcrumbs(route)) as any;
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[0].name).toBe('Home');
    expect(schema.itemListElement[2].name).toBe(route.seo.h1);
  });
});

describe('generateCanonicalUrl', () => {
  it('generates correct canonical URL', () => {
    expect(generateCanonicalUrl('compress-jpeg-to-50kb')).toBe('https://localresizer.com/compress-jpeg-to-50kb');
  });
});
