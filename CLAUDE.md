# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Source of truth

Use these sources in this order:

1. `src/data/routes.ts` — shipped route matrix and live tool configuration
2. `docs/current-public-capabilities.md` — shipped marketing / claim boundaries
3. `README.md` — developer-facing overview

Treat the files below as planning or historical context, **not** evidence of shipped features:

- `PRD.md`
- `docs/modules.md`
- files in `docs/plans/`

If planning docs conflict with shipped code, prefer `src/data/routes.ts` and `docs/current-public-capabilities.md`.

## Commands

```bash
npm run dev           # Start dev server (run manually in terminal)
npm run build         # Build static site only
npm run build:deploy  # Build + submit IndexNow (requires env)
npm run preview       # Preview production build
npm run typecheck     # astro check + tsc --noEmit
npm run test          # Run all tests
npm run smoke:dist    # Check built output against live-scope expectations
npm run verify        # typecheck + test + build
npm run test:routes   # Run route-matrix tests only
npm run test:image    # Run image helper tests only
```

## Architecture

LocalResizer is a privacy-first browser-based image tool site. All image processing runs client-side via Canvas API — zero server uploads.

**Stack**: Astro 5 (SSG) + React 19 (islands) + Tailwind CSS 4 + TypeScript strict mode. Deploys as static files to Cloudflare Pages.

### Route-driven live scope

`src/data/routes.ts` is the central live data layer. It defines `RouteConfig` and generates the currently shipped route set.

Three route families exist in code:

- `compress-{format}-to-{size}`
- `resize-image-to-{size}`
- `resize-{platform}-{asset}`

Only routes listed in `PHASE0_SLUGS` are currently active. They are exported as:

- `activeRoutes` — all currently shipped routes
- `phase0Routes` — alias kept for page-level clarity

To ship a new page, add its slug to `PHASE0_SLUGS`.

`src/pages/[slug].astro` consumes `phase0Routes` via `getStaticPaths()` and renders each route with the shared layout, `ImageProcessor`, content sections, FAQ, and HowTo schema.

### Image processing pipeline

Main engines:

- `src/lib/compress.ts` — binary-search quality compression for JPEG/WebP, PNG fallback strategies
- `src/lib/resize.ts` — dimension-based resize plus exact-canvas export logic
- `src/lib/image/` — shared canvas and geometry helpers used by both engines

### Component model

`src/components/ImageProcessor.tsx` is the only React island. It orchestrates smaller UI pieces in `src/components/image-processor/`.

Modes:

- **Configurable** (homepage): user picks compress/resize and enters values
- **Fixed** (slug pages): route config locks action, format, and target

State flow: `idle` → file drop → `processing` → `done` / `error`.

### Testing focus

Current automated coverage includes:

- route generation and public-scope constraints
- content / schema helpers
- extracted image geometry and ImageProcessor utility helpers
- built-output smoke checks against `dist/` and `docs/current-public-capabilities.md`

When changing image-processing behavior, run at least:

```bash
npm run test:image
npm run test
npm run typecheck
```

## Key constraints

- Static images only: JPEG, PNG, WebP
- No GIF, no video, no animated formats in the live public release
- `acceptFormats` on every live route excludes `image/gif`
- Tests enforce required SEO / FAQ / HowTo fields on live routes
- `build` must stay side-effect free; external submission belongs in `build:deploy`
