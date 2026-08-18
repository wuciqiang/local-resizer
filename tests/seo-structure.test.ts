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
    expect(homepage.includes("'resize-png'")).toBe(true);
    expect(homepage.includes("'batch-resize-images'")).toBe(true);
    expect(resizeHub.includes("'resize-png'")).toBe(true);
    expect(resizeHub.includes("'batch-resize-images'")).toBe(true);
    expect(resizeHub.includes("'resize-image-to-20kb'")).toBe(true);
    expect(compressHub.includes("'compress-image-to-500kb'")).toBe(true);
  });

  it('links the resize hub introduction to the focused PNG workflow without changing its primary intent', () => {
    const resizeHub = read('src/pages/resize-image.astro');

    expect(resizeHub).toContain("const title = 'Resize Image Online - Private Browser Resizer | LocalResizer';");
    expect(resizeHub).toContain('>Resize image online</h1>');
    expect(resizeHub).toContain("<a href={formatPagePath('resize-png')}>Resize PNG tool</a>");
    expect(resizeHub).toContain('For PNG files that need transparent backgrounds, use the <a');
    expect(resizeHub).toContain('to change width and height while keeping PNG output.');
  });

  it('keeps the core resize and compress hubs in the primary navigation', () => {
    const layout = read('src/layouts/BaseLayout.astro');

    expect(layout).toContain("formatPagePath('resize-image')");
    expect(layout).toContain("formatPagePath('compress-image')");
  });

  it('uses the compact SVG favicon instead of loading large raster favicons', () => {
    const layout = read('src/layouts/BaseLayout.astro');

    expect(layout).toContain('href="/favicon.svg"');
    expect(layout).not.toContain('href="/favicon.ico"');
    expect(layout).not.toContain('href="/favicon.png"');
  });

  it('ships a dedicated batch resize page with one canonical intent', () => {
    const batchPage = read('src/pages/batch-resize-images.astro');

    expect(batchPage).toContain("getRouteBySlug('batch-resize-images')");
    expect(batchPage).toContain('maxBatchSize={route.maxBatchSize}');
    expect(batchPage).toContain('resizeMode="fit"');
    expect(batchPage).toContain('One ZIP download');
  });
});
