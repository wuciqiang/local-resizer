import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('SEO structure for specialized workflows', () => {
  it('adds dedicated guide hubs for signature and image utility workflows', () => {
    const siteStructure = read('src/lib/site-structure.ts');

    expect(siteStructure.includes("'signature-tools'")).toBe(true);
    expect(siteStructure.includes("'image-tools'")).toBe(true);
    expect(siteStructure.includes("route.intent === 'signature'")).toBe(true);
    expect(siteStructure.includes("route.intent === 'image-splitter'")).toBe(true);
  });

  it('links the homepage to the new specialized guide hubs', () => {
    const homepage = read('src/pages/index.astro');

    expect(homepage.includes('href="/signature-tools"')).toBe(true);
    expect(homepage.includes('href="/image-tools"')).toBe(true);
  });
});
