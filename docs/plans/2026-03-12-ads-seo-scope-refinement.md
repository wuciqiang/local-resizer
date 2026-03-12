# Ads and SEO Scope Refinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tighten the public copy and supporting docs so the live site presents a credible, ads-friendly, static-image-only tool scope with no feature overclaiming.

**Architecture:** Keep the existing Astro route set and React processor unchanged for core behavior, then add clearer capability-boundary content on the homepage and trust pages while generating one internal reference document for future publishing and campaign copy. Validation relies on existing tests, a fresh production build, and targeted content checks against generated HTML.

**Tech Stack:** Astro, React, TypeScript, Vitest, static site generation.

### Task 1: Refine public homepage messaging

**Files:**
- Modify: `src/pages/index.astro`

**Step 1: Review current homepage copy**

Run: `bash -lc "sed -n '1,220p' src/pages/index.astro"`
Expected: Current homepage is tool-first but can still state the supported outputs and limits more explicitly.

**Step 2: Add a capability-boundary section**

Implement a concise section that lists:
- what the live site does today
- what each current page family actually guarantees
- what is intentionally out of scope for now

**Step 3: Verify the page still reads naturally**

Run: `rg -n "static|YouTube|GIF|video|scope|supports|limits" src/pages/index.astro`
Expected: Copy is consistent with the live static-image-only positioning.

### Task 2: Tighten trust-page wording

**Files:**
- Modify: `src/pages/about.astro`
- Modify: `src/pages/contact.astro`
- Modify: `src/pages/privacy.astro`
- Modify: `src/pages/terms.astro`

**Step 1: Review existing trust pages**

Run: `bash -lc "sed -n '1,220p' src/pages/about.astro; echo '---'; sed -n '1,220p' src/pages/contact.astro; echo '---'; sed -n '1,220p' src/pages/privacy.astro; echo '---'; sed -n '1,220p' src/pages/terms.astro"`
Expected: Pages are already aligned broadly, but can present the active scope in a more explicit and trustworthy way.

**Step 2: Add or refine current-scope statements**

Implement short sections that clearly state:
- current supported formats
- current page families
- private/local processing behavior
- no GIF/video workflows in the public release

**Step 3: Recheck wording**

Run: `rg -n -i "gif|video|static image|jpeg|png|webp|upload" src/pages/about.astro src/pages/contact.astro src/pages/privacy.astro src/pages/terms.astro`
Expected: Mentions are intentional and phrased as current-scope statements rather than feature promises.

### Task 3: Create an internal capability-boundary reference

**Files:**
- Create: `docs/current-public-capabilities.md`

**Step 1: Draft a reusable scope document**

Write a short internal document covering:
- homepage claim set
- 8 live tool-page claim set
- hard constraints not to promise
- future-scope items that must stay out of public copy for now

**Step 2: Re-read for consistency**

Run: `bash -lc "sed -n '1,220p' docs/current-public-capabilities.md"`
Expected: The document can be reused for SEO briefs, ad copy, and future content work.

### Task 4: Verify and ship confidence

**Files:**
- Test: `tests/routes.test.ts`
- Test: generated HTML in `dist/`

**Step 1: Run tests**

Run: `npm test`
Expected: PASS

**Step 2: Run production build**

Run: `npm run build`
Expected: PASS

**Step 3: Check generated HTML and docs for drift**

Run: `rg -n -i --glob "*.html" "gif|video|Youtube|YouTube|static images only|target file size" dist`
Expected: No stale `Youtube` casing, no unwanted GIF/video promises, and live pages still use the intended static-image wording.
