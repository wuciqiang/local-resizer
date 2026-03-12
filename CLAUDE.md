# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (run manually in terminal)
npm run build      # Build static site (astro build)
npm run preview    # Preview production build
npm run test       # Run all tests (vitest run)
npx vitest run tests/routes.test.ts   # Run a single test file
```

## Architecture

LocalResizer is a privacy-first browser-based image tool site. All image processing runs client-side via Canvas API — zero server uploads.

**Stack**: Astro 5 (SSG) + React 19 (islands) + Tailwind CSS 4 + TypeScript strict mode. Deploys as static files to Cloudflare Pages.

### Route-driven pSEO system

`src/data/routes.ts` is the central data layer. It defines a `RouteConfig` type and programmatically generates route configs for three page families:

- **compress-{format}-to-{size}** — target file-size compression (JPEG/PNG/WebP × 27 KB tiers + 7 MB tiers)
- **resize-image-to-{size}** — format-agnostic resize to file-size budget (20 sizes)
- **resize-{platform}-{asset}** — exact canvas dimensions for social platforms (21 assets)

Only routes listed in `PHASE0_SLUGS` are actually built. This gates the full matrix (~180 possible routes) down to 8 live pages, preventing SEO dilution during early launch. To add a new page, add its slug to `PHASE0_SLUGS`.

`src/pages/[slug].astro` consumes `allRoutes` via `getStaticPaths()` and renders each route with the shared layout, `ImageProcessor` component, content sections, FAQ, and HowTo schema.

### Image processing pipeline

Two independent engines in `src/lib/`:

- **compress.ts** — Binary-search on JPEG/WebP quality parameter to hit a target file size. For PNG (no quality knob), scales pixel dimensions instead. Tracks `bestUnder` and `bestAny` candidates across iterations.
- **resize.ts** — Dimension-based resize (fit/contain/cover/stretch) with optional `forceCanvasSize` for platform assets. File-size-targeted resize combines dimension scaling with a compress pass for non-PNG formats.

Both use `loadImage` → Canvas `drawImage` → `toBlob` pattern. Memory management: `URL.revokeObjectURL` in `finally` blocks and canvas zeroing after use.

### Component model

`ImageProcessor.tsx` is the only React island. It has two modes:
- **Configurable** (homepage): user picks compress/resize, enters size/dimensions, uses presets
- **Fixed** (slug pages): action, format, target locked by route config via props

State flow: `idle` → file drop → `processing` (progress %) → `done` (results with download) or `error`.

Astro components (`HowToSection`, `FaqSection`, `FooterLinks`) handle static content sections on slug pages.

### Content generation

`src/lib/content.ts` generates page copy (intro text, detail text, highlights, format info) from route config properties. `src/lib/seo.ts` generates HowTo and FAQ JSON-LD schemas.

### Styling

`src/styles/global.css` uses Tailwind 4's `@theme` block for design tokens. Custom utilities: `shadow-soft`, `shadow-soft-lg`, animations (`fade-up`, `border-flow`, `stagger-children`), and prose styles for long-form pages.

## Key constraints

- Static images only: JPEG, PNG, WebP. No GIF, no video, no animated formats.
- `acceptFormats` on every route excludes `image/gif` — tests enforce this.
- Tests verify all routes have: title, description, h1, ≥5 FAQ items, exactly 3 howToSteps.
- `relatedLinks` are pruned to only reference other built (Phase 0) slugs.
- Max 20 files per batch, 50 MB per file default.
