# Tool Page SEO Template and Supported Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the 8 live tool pages with a more consistent SEO-friendly structure and add a public supported-formats/current-limits page for trust and ad-review readiness.

**Architecture:** Reuse the existing route-driven Astro pages, add one new public page for capability boundaries, and introduce one structured highlights section on tool pages so each route clearly states use case, actual output behavior, and limits. Verification should include tests for any new content helper logic plus a fresh production build and content grep checks.

**Tech Stack:** Astro, TypeScript, route-driven content helpers, Vitest.

### Task 1: Add reusable tool-page highlight content

**Files:**
- Modify: `src/lib/content.ts`
- Test: `tests/content.test.ts`

**Step 1: Write the failing test**

Create tests covering highlight output for:
- JPEG compress route
- PNG compress route
- resize-to-size route
- platform route

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the new helper is not implemented yet.

**Step 3: Write minimal implementation**

Add a helper that returns three consistent cards per route:
- best for
- output behavior
- current limits

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

### Task 2: Render the new SEO-friendly highlight section on all live tool pages

**Files:**
- Modify: `src/pages/[slug].astro`

**Step 1: Add the section**

Render the new three-card highlights block between the intro copy and HowTo section so every live tool page follows the same structure.

**Step 2: Verify page output**

Run: `bash -lc "sed -n '1,220p' src/pages/[slug].astro"`
Expected: The page now includes a reusable section for fit/behavior/limits.

### Task 3: Add a public supported-formats and current-limits page

**Files:**
- Create: `src/pages/supported-formats.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`

**Step 1: Create the page**

The page should clearly describe:
- current supported formats
- current page families
- what the live release does not support
- links back to trust/contact pages

**Step 2: Link it from the site shell**

Add a visible navigation/footer entry so the page is easy to find for users and reviewers.

**Step 3: Link it from the homepage**

Add a lightweight pointer from the homepage live-scope area to the new page.

### Task 4: Verify generated output

**Files:**
- Test: generated HTML in `dist/`

**Step 1: Run tests**

Run: `npm test`
Expected: PASS

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Check final output**

Run: `rg -n --glob "*.html" "Supported Formats|Current limits|Best for|Output behavior|gif|video|Youtube" dist`
Expected: New sections are present, casing is correct, and unsupported-media mentions appear only as scope limits.
