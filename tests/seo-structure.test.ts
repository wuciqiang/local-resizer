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

    expect(homepage.includes("formatPagePath('signature-tools')")).toBe(true);
    expect(homepage.includes("formatPagePath('image-tools')")).toBe(true);
  });

  it('keeps data-backed target-size links prominent on hubs', () => {
    const homepage = read('src/pages/index.astro');
    const resizeHub = read('src/pages/resize-image.astro');
    const compressHub = read('src/pages/compress-image.astro');

    expect(homepage.includes("'resize-image-to-20kb'")).toBe(true);
    expect(homepage.includes("'compress-image-to-500kb'")).toBe(true);
    expect(resizeHub.includes("'resize-image-to-20kb'")).toBe(true);
    expect(compressHub.includes("'compress-image-to-500kb'")).toBe(true);
  });
});
