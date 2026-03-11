# PicResizer Matrix

Astro-based pSEO starter for exact-size image compression pages.

## What is included
- Static route generation from keyword samples
- Dynamic page metadata and JSON-LD placeholders
- Browser-only image compression demo using binary-search quality tuning
- Sitemap integration scaffold for static export

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Route pattern

`/compress-{format}-to-{size}`

Examples:
- `/compress-jpeg-to-50kb`
- `/compress-png-to-100kb`
- `/compress-image-to-20kb`

## Compression algorithm notes

The demo in `src/lib/compress.ts`:
- loads the image into an in-browser canvas
- optionally rescales oversized inputs
- uses binary search over quality values to approach `targetKB`
- returns the closest blob found within a fixed iteration budget

This is enough for an MVP demo. In production, PNG handling may need a separate branch because quality-based PNG export is browser-dependent and less predictable.

## Next implementation steps
- replace sample data with CSV or CMS input
- add richer copy templates from content team
- add visual preview and drag-drop UX polish
- measure Lighthouse and tune font, JS, and image budgets
