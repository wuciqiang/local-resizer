# Static Image Page Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the current live pages so every public promise matches the real static-image-only behavior.

**Architecture:** Keep the current Astro + React image-processing flow, narrow scope to static JPEG/PNG/WebP images, and adjust route copy plus processor behavior so homepage and the 8 shipped tool pages describe exactly what the browser can do today. Verification relies on route tests, a production build, and targeted content checks against generated HTML.

**Tech Stack:** Astro, React, TypeScript, Vitest, local browser canvas/image processing.

### Task 1: Audit the current live-page scope

**Files:**
- Modify: `src/data/routes.ts`
- Modify: `src/lib/content.ts`
- Test: `tests/routes.test.ts`

**Step 1: Verify shipped pages and supported formats**

Run: `git diff -- src/data/routes.ts src/lib/content.ts tests/routes.test.ts`
Expected: Current changes remove GIF/video promises from the shipped route set and tests cover the remaining static-image scope.

**Step 2: Identify any leftover overclaims**

Run: `rg -n "gif|video|YouTube|Youtube" src tests`
Expected: Only intentional mentions remain, with GIF/video described as unsupported and `YouTube` cased correctly.

### Task 2: Align homepage and tool-page messaging with actual behavior

**Files:**
- Modify: `src/components/ImageProcessor.tsx`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/[slug].astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/contact.astro`
- Modify: `src/pages/privacy.astro`
- Modify: `src/pages/terms.astro`

**Step 1: Check configurable processor behavior**

Run: `git diff -- src/components/ImageProcessor.tsx src/pages/index.astro src/pages/[slug].astro`
Expected: Homepage exposes real compress/resize controls, and focused pages pass exact options for the shipped workflows.

**Step 2: Remove or soften any text that overpromises**

Run: `rg -n "exactly|GIF|video|upload|perfect" src/pages src/components/ImageProcessor.tsx`
Expected: Copy only promises local static-image processing, realistic size targeting, and exact platform canvases where the code truly enforces them.

### Task 3: Verify generated output and quality gates

**Files:**
- Test: `tests/routes.test.ts`
- Test: generated HTML under `dist/`

**Step 1: Run automated verification**

Run: `npm test`
Expected: PASS

**Step 2: Run production build**

Run: `npm run build`
Expected: PASS

**Step 3: Check generated HTML for shipped pages**

Run: `rg -n "gif|video|YouTube|Youtube|Static images only" dist`
Expected: No active GIF/video feature promises remain, and shipped pages use the current static-image positioning.
