# localresizer P0 pages implementation plan

Date: 2026-04-20
Source PRD: `docs/prd_localresizer_p0_pages_20260420.md`

## Assumptions

- This implementation follows the PRD's explicit priority order rather than trying to ship all six keywords as equal-status pages.
- `Phase 0` and `Phase 1` are in-scope for code completion in this pass because they fit the current Astro + React + browser-local image-processing architecture.
- `signature-resizer` and `image-splitter` are not shipped as fake landing pages in this pass. They remain planned items because the current product does not yet have the trim/crop and split engines required by the PRD.

## Success criteria

1. Existing YouTube exact-canvas pages behave exactly like the current public claims.
2. Three new routes ship as real tool pages, not content-only pages:
   - `/photo-resizer-20kb`
   - `/compress-jpg-file`
   - `/resize-png`
3. New routes are reflected consistently in:
   - route generation
   - page copy
   - FAQ / HowTo schema
   - related links
   - guide and breadcrumb structure
   - homepage focused-page listing
   - sitemap and built HTML smoke checks
4. Tests and build verification pass without broad refactors outside the request scope.

## Phase breakdown

### Phase 0: live behavior alignment

Goal:
- Fix `/resize-youtube-banner` and `/resize-youtube-thumbnail` so their actual output matches the documented exact-canvas `contain` behavior.

Implementation tasks:
1. Update platform route generation so current live YouTube pages use `resizeMode: 'contain'`.
2. Keep `forceCanvasSize: true` so output remains exact `2560 x 1440` and `1280 x 720`.
3. Re-check content helpers so their wording still matches the runtime behavior.
4. Add/adjust tests covering:
   - route config for YouTube pages
   - content copy promises for exact-canvas pages
   - geometry/helper assumptions if needed
5. Update `docs/current-public-capabilities.md` live route count and page list only after all shipped routes are real.

Verification:
- Route tests confirm both YouTube routes still exist and now use `contain`.
- Content tests confirm wording stays aligned with `keep the whole image visible` and `padding may appear`.

### Phase 1: low-risk semantic route expansion

Goal:
- Ship three new real pages that reuse the existing processing engine with minimal architecture expansion.

#### 1. Route model expansion

Tasks:
1. Add route intent and lightweight processor defaults to `RouteConfig`.
2. Keep runtime behavior driven by explicit props, not by ambiguous text-only intent checks.
3. Extend route generation to support:
   - generated matrix routes
   - explicit semantic routes

New route intents:
- `document-photo`
- `generic-compress`
- `format-resize`

New route-level processor controls:
- `lockedAction`
- `defaultTargetSizeBytes`
- `defaultDimensions`
- `hideActionTabs`

Rationale:
- `/compress-jpg-file` needs compress locked but target size configurable.
- `/resize-png` needs resize locked but dimensions configurable.
- `/photo-resizer-20kb` can stay fixed, but still benefits from semantic copy and related-link control.

#### 2. ImageProcessor intermediate mode

Tasks:
1. Extend `ImageProcessorProps` to support locked action + configurable defaults.
2. Replace the binary `isConfigurable` model with capability flags:
   - action switch visibility
   - size control visibility
   - dimension control visibility
3. Preserve current homepage behavior.
4. Preserve current fixed-page behavior.
5. Add tests for:
   - initial control defaults
   - locked action behavior
   - configurable target-size default behavior

Runtime expectations:
- `/compress-jpg-file`
  - accepts JPEG only
  - opens in compress mode
  - shows target-size controls
  - hides action tabs
- `/resize-png`
  - accepts PNG only
  - opens in resize mode
  - shows dimension controls
  - hides action tabs
  - outputs PNG
- `/photo-resizer-20kb`
  - remains fixed to 20KB target-size behavior

#### 3. Content system updates

Tasks:
1. Add route-intent-aware copy for:
   - photo 20KB
   - generic JPG compression
   - generic PNG resizing
2. Add route-intent-aware page highlights and context sections.
3. Add custom FAQ generators where the default family FAQ is insufficient.
4. Ensure all new copy respects hard public constraints:
   - static images only
   - browser-local processing
   - best-effort size targeting
   - no official certification claims
   - no GIF/PDF/video/AI claims

#### 4. Site structure updates

Tasks:
1. Keep new routes inside the dynamic route system so breadcrumbs/schema stay automatic.
2. Map new pages to existing hubs:
   - `/photo-resizer-20kb` -> `resize-image`
   - `/compress-jpg-file` -> `compress-image`
   - `/resize-png` -> `resize-image`
3. Ensure homepage focused pages list includes the new live routes.
4. Ensure related links stay within shipped routes.

#### 5. Test and smoke updates

Tasks:
1. Update `tests/routes.test.ts` route counts and route-specific assertions.
2. Update `tests/content.test.ts` for new semantic copy.
3. Update `tests/site-structure.test.ts` for hub mapping.
4. Update `tests/seo.test.ts` if canonical/schema assumptions change.
5. Update `tests/image-processor-utils.test.ts` for new default-control helpers.
6. Update `scripts/check-dist.js` by updating the capabilities doc count/list, not by loosening checks.

Verification:
- `/photo-resizer-20kb`, `/compress-jpg-file`, `/resize-png` exist in build output.
- Sitemap includes all shipped slugs.
- Each page renders:
  - H1
  - live tool
  - HowTo schema with 3 steps
  - FAQ schema with >= 5 items
  - guide cards
  - related tools

## Planned but not shipped in this pass

### Phase 2: signature-resizer

Blocked by:
- no trim/crop module
- no signature-specific workflow UI
- no preview/reset model for crop operations

Required MVP before shipping:
1. Add trim/crop helper
2. Add signature workflow controls
3. Add truthful signature-specific disclaimers
4. Add tests for trim geometry / crop behavior

### Phase 3: image-splitter

Blocked by:
- no `split` action in route/runtime types
- no split processing engine
- no multi-result download UI

Required MVP before shipping:
1. Add split engine
2. Add rows/columns controls
3. Add multi-file result rendering and download
4. Add naming and geometry tests

## Final verification checklist

- `npm run typecheck`
- `npm run test:routes`
- `npm run test:content`
- `npm run test:image`
- `npm run test:seo`
- `npm run build`
- `npm run smoke:dist`
