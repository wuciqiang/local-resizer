# PRD: LocalResizer Keyword Expansion

- Date: 2026-04-26
- Project: `G:\Workspace\local-resizer`
- Keyword reports: `G:\Workspace\auto-game-keyword-tool\backend\reports`
- Scope: latest keyword-to-product requirements for `localresizer.com`
- Evidence mode: offline review of existing reports; no new Google Trends round was opened in this pass

## 1. Executive Decision

The current site has already absorbed the manually reviewed P0 localresizer terms from `trends_review_20260419.md`:

| Report keyword | Current URL | Status |
| --- | --- | --- |
| `compress jpg file` | `/compress-jpg-file` | live |
| `photo resizer 20kb` | `/photo-resizer-20kb` | live |
| `resize png` | `/resize-png` | live |
| `resize youtube banner` | `/resize-youtube-banner` | live |
| `signature resizer` | `/signature-resizer` | live |
| `splitter image` / `image splitter` | `/image-splitter` | live |

The next SEO expansion should not be another broad pSEO dump. The reports contain 386 localresizer rows, including 297 `build-now` rows, but many are aliases or noisy variants. The product should absorb them as a small number of intent clusters:

1. Upgrade existing `/resize-image` and `/compress-image` hubs into stronger tool-first hub pages.
2. Open a controlled set of target-size pages already supported by route constants.
3. Add batch/bulk landing pages only if they reuse the existing 20-file batch flow truthfully.
4. Expand platform preset pages from YouTube into Instagram, Discord, Twitch, and X/Twitter.
5. Add document-photo regional pages only with best-effort disclaimers and no official compliance promise.
6. Keep cropper and JPG merge as build-test modules, not immediate build-now pages.
7. Reject or defer AI, animated GIF, PDF, video, audio, Office, ZIP, SVG/HEIC/BMP, software, and partition-resizer intent.

## 2. Current Capability Boundary

Current public capability source:

- Static JPEG, PNG, and WebP only.
- Browser-local processing; no server upload.
- Compress by file size and resize by dimensions.
- Best-effort target-size behavior, not exact byte guarantees.
- Live exact-canvas platform pages for YouTube banner and thumbnail.
- Live signature trim/resize/export workflow.
- Live image splitter grid workflow.

Do not publish pages that require these capabilities until the capability exists:

- animated GIF workflows
- video, audio, PDF, Office, ZIP, or archive workflows
- AI editing, quality enhancement, watermark removal, background removal
- server-side processing, account storage, cloud upload
- official government, exam, or platform compliance certification

## 3. Report Evidence Summary

Primary files reviewed:

- `localresizer_dev_order_20260420.csv`
- `verified_backlog_20260420.md`
- `backlog_existing_site_live_p0_20260420.csv`
- `backlog_existing_site_bulk_build_now_20260420.csv`
- `actionable_keywords_20260419.md`
- `dev_plan_20260420.md`
- `prd_localresizer_p0_pages_20260420.md`

Localresizer report counts from `localresizer_dev_order_20260420.csv`:

| Bucket | Count | Review result |
| --- | ---: | --- |
| `build-now` | 297 | Mostly valid families, but must be canonicalized into clusters |
| `build-test` | 4 | Real demand, requires new or controlled UX |
| `defer` | 85 | Mostly generic/noisy/non-image/unsupported intent |

High-level family signals in the 297 `build-now` rows:

| Pattern | Count | Examples | Decision |
| --- | ---: | --- | --- |
| Core resize/compress image terms | 191 | `resize image`, `image resizer online`, `compress jpg`, `photo resizer` | absorb through hubs and canonical pages |
| KB/MB target-size terms | 47 | `compress image to 50kb`, `resize image to 200kb`, `resizer to 1mb` | absorb selectively |
| Batch/bulk terms | 9 | `batch image resizer`, `bulk photo resizer` | absorb if UI/copy reflects 20-file limit |
| Platform preset terms | 30 | `image resizer for instagram`, `resize discord emoji`, `resizer twitch emote` | absorb in waves |
| Document/regional upload terms | 12 | `passport photo resizer`, `gds photo resizer`, `rrb signature resizer` | build-test with compliance disclaimers |
| Cropper terms | 7 | `cropper image`, `online cropper` | build-test only after real crop UI |
| Unsupported format/capability terms | 14 inside `build-now` | `online compressor pdf`, `online compressor mp4`, `image resizer with ai` | reject/defer despite CSV action |

## 4. Keyword Absorption Plan

### 4.1 Already Covered

These terms should be mapped to existing URLs with improved internal links, not new duplicate pages:

| Keyword family | Representative keywords | Canonical URL |
| --- | --- | --- |
| JPG compressor | `compress jpg file`, `compress jpg`, `compress jpg online`, `compress jpeg file` | `/compress-jpg-file` |
| 20KB photo | `photo resizer 20kb`, `image resizer 20kb`, `photo resizer resizer 20kb` | `/photo-resizer-20kb` |
| PNG resize | `resize png`, `png resize online`, `free resizer png` | `/resize-png` |
| YouTube banner | `resize youtube banner`, `image resizer youtube banner`, `resizer youtube banner` | `/resize-youtube-banner` |
| YouTube thumbnail | `resize youtube thumbnail`, `image resizer youtube thumbnail` | `/resize-youtube-thumbnail` |
| Signature | `signature resizer`, `resizer signature`, `signature resize` | `/signature-resizer` |
| Image splitter | `splitter image`, `image splitter` | `/image-splitter` |

Requirement:

- Add these keyword variants only as copy, FAQ, related links, or metadata where natural.
- Do not create alternate slugs that compete with the canonical URL.
- Canonical tags must point to the chosen canonical URL.

### 4.2 Build Now: Hub Strengthening

The broadest keywords should be captured by two tool-first hub pages, not dozens of thin pages.

| URL | Target keywords | Product requirement |
| --- | --- | --- |
| `/resize-image` | `resize image`, `image resizer`, `resize image online`, `free image resizer`, `photo resizer`, `picture resizer` | Make this a tool-first resize hub with configurable dimensions and links to target-size, format, platform, and document-photo pages. |
| `/compress-image` | `compress image`, `compress image online`, `image compressor`, `online image compressor`, `compress photo`, `free compress image` | Make this a tool-first compression hub with target-size controls and links to JPG/PNG/WebP and KB pages. |

Acceptance:

- First viewport contains the actual working tool, not only guide content.
- Copy states static JPEG/PNG/WebP and local browser processing.
- FAQ explains best-effort file size behavior.
- Related links include canonical pages from section 4.1 and new target-size pages from section 4.3.

### 4.3 Build Now: Target-Size Pages

Use existing route constants and processing behavior. Prioritize only sizes with clear report evidence and common upload intent.

| Priority | URL | Target keywords | Notes |
| --- | --- | --- | --- |
| P0 | `/compress-image-to-50kb` | `compress image to 50kb`, `online compressor to 50kb` | Broad image compressor page, all static supported formats. |
| P0 | `/compress-image-to-100kb` | `compress image to 100kb`, `online compressor to 100kb` | Common upload target. |
| P0 | `/compress-image-to-200kb` | `compress image to 200kb`, `online compressor 200kb` | Complements existing JPEG/PNG format pages. |
| P0 | `/resize-image-to-50kb` | `resize image to 50kb`, `image resizer under 50kb`, `resizer image 50kb` | Current constants already include `50kb`. |
| P1 | `/resize-image-to-200kb` | `resize image to 200kb`, `photo resizer under 200kb` | Complements existing `100kb`. |
| P1 | `/resize-image-to-500kb` | `resize under 500kb`, `resizer to 500kb` | Only if internal links can support it. |
| P1 | `/resize-image-to-1mb` | `resizer to 1mb`, `resizer less than 1 mb` | MB upload family. |

Acceptance:

- Pages reuse existing best-effort target-size behavior.
- If input is already under target, result behavior is explained clearly.
- No page promises exact final bytes.
- PNG behavior must explain the PNG strategy choice if shown.

### 4.4 Build Now: Batch/Bulk Pages

The current processor accepts up to 20 files. That is enough to absorb batch/bulk intent truthfully.

| URL | Target keywords | Requirement |
| --- | --- | --- |
| `/batch-image-resizer` | `batch image resizer`, `image resizer batch`, `resizer multiple images` | Working resize page with multi-file upload, visible 20-file limit, and dimension controls. |
| `/bulk-image-resizer` | `bulk image resizer`, `image resizer bulk`, `resizer bulk` | Canonicalize to `/batch-image-resizer` or make it an alias page only if canonical handling is clear. |
| `/batch-photo-resizer` | `batch photo resizer`, `bulk photo resizer` | Optional semantic variant; should canonicalize to batch image unless photo-specific copy adds real value. |

Recommendation:

- Build one canonical page first: `/batch-image-resizer`.
- Treat `/bulk-image-resizer` and `/batch-photo-resizer` as internal-link/FAQ variants unless search data later justifies standalone pages.

### 4.5 Build Now / Test: Platform Presets

The code already contains platform asset constants beyond YouTube. Publish in waves to avoid thin platform sprawl.

Wave 1:

| URL | Target keywords | Dimensions |
| --- | --- | --- |
| `/image-resizer-for-instagram` | `image resizer for instagram`, `resize image for instagram`, `resizer instagram` | Hub for Instagram post/story/profile. |
| `/resize-instagram-post` | `resizer for instagram post` | 1080 x 1080 |
| `/resize-instagram-story` | Instagram story image resize variants | 1080 x 1920 |
| `/resize-instagram-profile-photo` | Instagram profile photo resize variants | 320 x 320 |

Wave 2:

| URL | Target keywords | Dimensions / constraints |
| --- | --- | --- |
| `/resize-discord-emoji` | `resize discord emoji` | 128 x 128, max file size note if enforced |
| `/resize-twitch-emote` | `resizer twitch emote`, `resizer emote twitch` | 112 x 112 |
| `/x-profile-picture-resizer` | `x profile picture resizer` | 400 x 400 via Twitter/X profile-photo asset |

Acceptance:

- Use exact canvas with `contain` padding unless copy explicitly says crop/fill.
- Do not claim official platform approval.
- Add a platform-size guide only when at least three platform pages are live.

### 4.6 Build Test: Document Photo And Regional Upload Pages

Reports show real regional/document-photo demand (`PAN`, `GDS`, `RRB`, `passport`, `railway`, signature variants). This can fit LocalResizer only as a best-effort local image helper.

Build-test candidates:

| URL | Keywords | Decision |
| --- | --- | --- |
| `/passport-photo-resizer` | `passport photo resizer` | Build-test, only if page avoids official compliance language. |
| `/pan-card-photo-resizer` | `pan card photo resizer`, `pan photo resizer` | Build-test for India demand; must be geo-specific and disclaimer-heavy. |
| `/gds-photo-resizer` | `gds photo resizer`, `india post gds photo resizer` | Build-test; use upload-size helper framing. |
| `/gds-signature-resizer` | `gds signature resizer`, `india post gds signature resizer` | Build-test; can link to existing `/signature-resizer`. |
| `/rrb-signature-resizer` | `rrb signature resizer`, `signature resizer rrb` | Watchlist unless GDS signature page performs. |

Acceptance:

- No "official", "approved", "guaranteed", or "valid for submission" claim.
- Page must state it does not verify government/exam rules.
- If dimensions or KB defaults are shown, they must be editable and described as common presets, not certified rules.
- Add India-specific copy only where the keyword family is India-specific.

### 4.7 Build Test: Cropper

Report keywords:

- `cropper image`
- `cropper online`
- `online cropper`
- `cropper tool`
- noisy variants: `cropper js`, `online gif cropper`

Decision:

- Do not absorb as `build-now`.
- Build only after a real crop UI exists.
- Do not target GIF cropper until animated GIF support exists.

MVP requirement:

- URL: `/image-cropper`
- Static JPEG/PNG/WebP only.
- Manual crop rectangle with preview.
- Export cropped static image locally.
- Optional aspect-ratio presets.
- No AI crop, background removal, GIF frame crop, or PDF crop.

### 4.8 Build Test / Defer: Merge JPG Files

Report keyword:

- `merge jpg files`

Decision:

- Defer until a clear image-only merge/combine module is designed.
- SERP/intent contamination with PDF merge means this should not be mixed into current resize/compress pages.

Possible MVP later:

- URL: `/merge-jpg-files`
- JPEG-only input.
- Combine images vertically, horizontally, or into a grid.
- Export a single JPEG.
- Explicitly not PDF merge.

## 5. Reject / Defer Rules

Even if a row appears as `build-now` in the bulk classifier, do not build pages for:

| Keyword examples | Reason |
| --- | --- |
| `image resizer with ai`, `resizer ai image`, `online resizer ai` | AI editing is outside public capability. |
| `online compressor gif`, `online gif cropper`, `resize gif online` | Animated GIF workflows are unsupported. |
| `online compressor pdf`, `online compressor ppt`, `online compressor zip` | Non-image document/archive intent. |
| `online compressor mp3`, `online compressor mp4`, `online compressor audio`, `online compressor video` | Audio/video workflows unsupported. |
| `resizer svg`, `resizer heic`, `resizer bmp` | Unsupported input/output format promise. |
| `compressorjs`, `cropper js`, `resize observer`, `resize vector c++` | Developer/library/informational intent, not LocalResizer tool intent. |
| `resize linux partition`, `resize xfs`, `resizer hdd`, `im-magic partition resizer` | Storage/partition software intent. |
| `online remove watermark` | Outside capability and high policy/product risk. |

## 6. Development Phases

### Phase 1: Hub And Target-Size Expansion

Build:

- `/resize-image` tool-first hub refresh
- `/compress-image` tool-first hub refresh
- `/compress-image-to-50kb`
- `/compress-image-to-100kb`
- `/compress-image-to-200kb`
- `/resize-image-to-50kb`
- `/resize-image-to-200kb`

Verification:

- `npm run test:routes`
- `npm run test:content`
- `npm run test:seo`
- `npm run build`
- manual upload test for JPEG, PNG, WebP

### Phase 2: Batch And Platform Presets

Build:

- `/batch-image-resizer`
- `/image-resizer-for-instagram`
- `/resize-instagram-post`
- `/resize-instagram-story`
- `/resize-instagram-profile-photo`
- `/resize-discord-emoji`
- `/resize-twitch-emote`
- `/x-profile-picture-resizer`

Verification:

- Multi-file upload with 1, 2, and 20 files.
- 21-file upload shows a clear limit message.
- Platform pages export expected canvas dimensions.
- Non-matching aspect ratios keep the full image visible with padding.

### Phase 3: Document Upload Tests

Build:

- `/passport-photo-resizer`
- `/pan-card-photo-resizer`
- `/gds-photo-resizer`
- `/gds-signature-resizer`

Verification:

- Copy has no official compliance guarantees.
- FAQ states local best-effort behavior.
- Defaults are editable or clearly described as helper presets.
- Internal links point to `/photo-resizer-20kb` and `/signature-resizer`.

### Phase 4: New UX Modules

Build-test only:

- `/image-cropper`
- `/merge-jpg-files`

Verification:

- Each page has real functionality before being indexed.
- No page is published as a content-only placeholder.

## 7. SEO Architecture Requirements

- Use one canonical URL per intent family.
- Add keyword variants to natural copy, FAQ, schema, and related links; avoid duplicate pages for reversed word order.
- Keep broad hubs linked from homepage navigation.
- Add target-size pages to `/resize-image` and `/compress-image` hubs.
- Add platform pages to `/youtube-image-sizes` only where relevant; create a broader `/social-media-image-sizes` guide after Instagram and Discord/Twitch pages are live.
- Keep all new pages in sitemap.
- Keep schema truthful: HowTo steps must match the actual tool controls.
- Avoid "without losing quality" as a promise; use "best effort" and "keeps usable quality" language.

## 8. Definition Of Done

- Every new URL has a working first-viewport tool.
- The page accepts only the formats it claims.
- Unsupported formats show clear errors.
- Output format and dimensions match page promises.
- The page appears in sitemap and internal links.
- Canonical metadata avoids alias cannibalization.
- Docs are updated if public capability expands.
- `npm run verify` passes before release.

## 9. Immediate Recommendation

Start with Phase 1. It captures the largest amount of report demand with the least product risk, because it reuses existing static-image compression and resize behavior. Do not start with cropper, merge JPG, GIF, AI, or regional government-photo pages until the lower-risk hubs and target-size pages are live and internally linked.
