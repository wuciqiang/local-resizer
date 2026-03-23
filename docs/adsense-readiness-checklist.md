# AdSense Readiness Checklist

Last updated: March 23, 2026

This checklist is the practical submission guide for the current LocalResizer release.

## Current recommendation

Do **not** expand into bulk pSEO pages right now.

The safer path is:

1. keep the current live scope accurate
2. improve trust and indexing on the existing pages
3. submit AdSense with a small, coherent, useful site

## What is already in place

- Custom domain: `https://localresizer.com`
- Footer trust pages: About, Privacy, Terms, Contact
- Public support email: `support@localresizer.com`
- Sitemap: `https://localresizer.com/sitemap-index.xml`
- Robots file: `https://localresizer.com/robots.txt`
- 8 live tool pages with bounded scope
- 3 guide hub pages:
  - `/compress-image`
  - `/resize-image`
  - `/youtube-image-sizes`
- 2 support/explainer pages:
  - `/why-image-size-is-best-effort`
  - `/jpeg-vs-png-vs-webp-for-upload-limits`
- Breadcrumbs and stronger internal linking
- Public claims aligned with actual current capabilities

## Must-pass checks before submission

### 1) Contact path really works

- [ ] Cloudflare Email Routing is configured for `support@localresizer.com`
- [ ] You have sent a real test email to `support@localresizer.com`
- [ ] You have confirmed you can receive and reply from the routed mailbox

Why this matters: a visible contact method that does not actually work weakens trust during review.

### 2) Trust pages are reachable and complete

- [ ] `/about/` is live and readable
- [ ] `/privacy/` is live and readable
- [ ] `/terms/` is live and readable
- [ ] `/contact/` is live and readable
- [ ] These pages are linked from the footer on every page

### 3) Search and crawl basics are healthy

- [ ] `robots.txt` loads successfully
- [ ] `sitemap-index.xml` loads successfully
- [ ] Sitemap includes the current public pages
- [ ] No important page is blocked by robots rules
- [ ] Canonical URLs point to `https://localresizer.com/...`

### 4) Indexing has started on the important URLs

In Google Search Console, manually request indexing for:

- [ ] `/`
- [ ] `/about/`
- [ ] `/privacy/`
- [ ] `/terms/`
- [ ] `/contact/`
- [ ] `/supported-formats/`
- [ ] `/compress-image/`
- [ ] `/resize-image/`
- [ ] `/youtube-image-sizes/`
- [ ] `/why-image-size-is-best-effort/`
- [ ] `/jpeg-vs-png-vs-webp-for-upload-limits/`
- [ ] 2-3 representative tool pages such as:
  - `/compress-jpeg-to-50kb/`
  - `/resize-image-to-100kb/`
  - `/resize-youtube-thumbnail/`

Practical goal: the homepage, trust pages, and a few representative guides/tools should begin indexing. You do **not** need to wait for every page to be indexed before applying.

### 5) No misleading claims remain

- [ ] Do not claim full offline/PWA support
- [ ] Do not claim unsupported formats or workflows
- [ ] Do not claim zero quality loss
- [ ] Do not claim exact target size on every image
- [ ] Do not claim unlimited file counts if the UI has batch limits

### 6) Site quality feels intentional

- [ ] No placeholder pages
- [ ] No empty categories or tag pages
- [ ] No "coming soon" landing pages created just for volume
- [ ] No AI-generated filler blog posts
- [ ] No duplicate near-empty SEO pages beyond the current live set

## What content is safe to add before AdSense

Generally safe:

- pages that explain real current product behavior
- pages that help users choose between current workflows
- pages that reduce confusion about file formats, limits, or expected results

Risky:

- mass-generated keyword pages
- dozens of thin "resize X to Y KB" pages without stronger differentiation
- generic blog content not tied to the product
- pages written mainly to increase ad inventory

Rule of thumb: if a page would still be useful with ads turned off, it is much safer.

## Submission-day checklist

- [ ] Site is fully deployed on the production domain
- [ ] Contact email works in practice
- [ ] Homepage tool works on desktop and mobile
- [ ] A few representative tool pages work end to end
- [ ] About, Privacy, Terms, Contact all load without errors
- [ ] Search Console shows the property is verified
- [ ] AdSense code is not installed in a broken or spammy way
- [ ] No major content or layout changes are in flight

## After submission

- [ ] Avoid large structural changes for 1-2 weeks unless fixing a real issue
- [ ] Keep submitting a few important URLs in GSC if indexing is slow
- [ ] Monitor Search Console for coverage and manual action issues
- [ ] If rejected, fix the stated reason before adding more page count

## Best next action order

1. configure and test `support@localresizer.com`
2. verify production pages after deployment
3. request indexing for the key URLs
4. wait for initial index movement
5. submit AdSense

## Short decision

For the current project, **a smaller but more trustworthy and better-indexed site is safer than expanding page count before AdSense**.
