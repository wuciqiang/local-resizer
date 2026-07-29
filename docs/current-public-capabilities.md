# Current Public Capabilities

Last updated: July 29, 2026

This document defines what the live public site can claim today.

## Homepage claim set

- LocalResizer resizes, compresses, and converts supported static images in the browser.
- Supported public formats are JPEG, PNG, and WebP.
- Files are processed locally with no image upload to the server for the current tool flow.
- The homepage tool supports:
  - compress by file size
  - resize by dimensions
  - up to 20 selected files and 100MB total per batch

## Current supporting guide and hub pages

The live public site also includes a small set of guide pages that explain the current scope and link to the published tools:

- `/compress-image`
- `/resize-image`
- `/youtube-image-sizes`
- `/image-tools`
- `/why-image-size-is-best-effort`
- `/jpeg-vs-png-vs-webp-for-upload-limits`
- `/supported-formats`
- `/png-resize-transparency-test`
- `/png-transparency-after-resizing`
- `/resize-vs-compress-png`

These guide pages help users navigate the current release. They do not expand the live processing scope beyond the homepage tool and the current published tool pages.

`/png-resize-transparency-test` is a browser-generated evidence resource that uses four defined synthetic patterns and reports real current-browser PNG output metrics; the page demonstrates browser behavior and does not add new upload formats or processing behavior. `/png-transparency-after-resizing` and `/resize-vs-compress-png` are supporting educational guides that explain current behavior and route users to the existing live pages. None of these three pages expands the supported upload formats or the current processing behavior.

`/compress-image` and `/resize-image` now include working tool controls in the page body. They remain within the same static JPEG/PNG/WebP, browser-local scope.

## Live tool-page claim set

The current public release includes 39 focused tool pages:

- `compress-image-to-20kb`
- `compress-jpeg-to-50kb`
- `compress-jpeg-to-20kb`
- `compress-jpeg-to-100kb`
- `compress-jpeg-to-200kb`
- `compress-jpeg-to-500kb`
- `compress-png-to-50kb`
- `compress-png-to-100kb`
- `compress-png-to-200kb`
- `compress-image-to-50kb`
- `compress-image-to-100kb`
- `compress-image-to-200kb`
- `compress-image-to-500kb`
- `compress-image-to-1mb`
- `compress-image-to-2mb`
- `resize-image-to-20kb`
- `resize-image-to-30kb`
- `resize-image-to-50kb`
- `resize-image-to-100kb`
- `resize-image-to-150kb`
- `resize-image-to-200kb`
- `resize-image-to-1mb`
- `resize-image-to-2mb`
- `resize-youtube-banner`
- `resize-youtube-thumbnail`
- `resize-instagram-post`
- `resize-instagram-story`
- `resize-facebook-cover`
- `resize-facebook-profile`
- `resize-linkedin-banner`
- `resize-linkedin-profile-photo`
- `batch-resize-images`
- `photo-resizer-20kb`
- `compress-jpg-file`
- `resize-png`
- `signature-resizer`
- `image-splitter`
- `webp-to-jpg`
- `photo-to-png`

### Compress JPEG pages

Allowed claims:

- Targets a JPEG file-size budget locally
- Keeps the original file if it is already below the requested limit
- Uses quality search to get close to the target size

Do not claim:

- perfect exact size on every image
- zero quality loss

### Compress PNG pages

Allowed claims:

- Keeps PNG output
- Tries to move toward the requested target size locally
- May reduce pixel dimensions when needed

Do not claim:

- PNG quality slider behavior like JPEG
- exact target size on every image

### Compress image target-size pages

Allowed claims:

- Works with static JPEG, PNG, and WebP images
- Targets a file-size budget locally
- Uses format-specific strategies to move toward the requested size
- Keeps the original file if it is already below the target

Do not claim:

- exact target size on every image
- PDF, video, audio, Office, ZIP, or animated GIF compression
- AI enhancement or quality recovery

### Resize-to-size pages

Allowed claims:

- Works with static JPEG, PNG, and WebP images
- Preserves the original aspect ratio
- Moves toward the requested file-size budget by reducing dimensions
- Keeps the original file if it is already below the target

Do not claim:

- exact target size on every image
- distortion-free enlargement to hit a target

### Semantic tool pages

Allowed claims:

- `photo-resizer-20kb` is a best-effort static-photo page built on the current 20KB target-size workflow
- `compress-jpg-file` keeps JPEG output and lets the user choose a JPEG target size locally
- `resize-png` keeps PNG output and resizes static PNG files by pixel dimensions locally
- `signature-resizer` can trim extra whitespace around a signature image and export a resized PNG or JPG locally
- `image-splitter` splits a static image into a rows-by-columns grid locally
- `batch-resize-images` applies one width and height bounding box to up to 20 static images, preserves each source aspect ratio and format, and can download the results as a ZIP
- `webp-to-jpg` converts one static WebP image to JPG, keeps its pixel dimensions, and fills transparent areas with the selected background color
- `photo-to-png` converts one static JPG or WebP image to PNG and keeps its pixel dimensions

Do not claim:

- official passport, exam, or government compliance guarantees
- PDF, SVG, GIF, or video support on these pages
- exact byte-for-byte target-size guarantees

### Format converter pages

Allowed claims:

- Re-encodes one supported static image to the page's locked JPG or PNG output
- Keeps the original pixel width and height
- Runs locally in the browser and downloads an extension that matches the output MIME
- WebP to JPG offers JPEG quality and a background color for transparent source pixels
- Keeps visible How It Works and FAQ content, while publishing BreadcrumbList as the only JSON-LD type on the two converter pages

Do not claim:

- conversion always creates a smaller file
- JPG conversion is lossless
- converting JPG to PNG restores detail or transparency
- EXIF, GPS, or color-profile metadata is preserved
- animated WebP, HEIC, SVG, GIF, PDF, or batch conversion support

### Exact canvas pages

Allowed claims:

- Exports an exact target canvas size
- Keeps the whole image visible
- May add padding when the source ratio does not match
- Does not auto-crop in the current release

Do not claim:

- automatic smart cropping
- ratio-matching without padding in every case

## Hard public constraints

These points must stay out of public promises for now:

- animated GIF workflows
- video workflows
- generic social-media page coverage beyond the currently live exact-canvas pages
- server-side processing
- account features
- cloud storage
- AI editing

## Resource limits

- Up to 20 selected files and 100MB total per batch
- Up to 50MB per individual file on the current general tools
- Source images are limited to 10,000 pixels per edge and 50 megapixels
- Output canvases are limited to 8,192 pixels per edge and 36 megapixels
- A processing run is limited to 120 megapixels of combined outputs and 100MB of retained result files
- JPEG, PNG, and WebP dimensions are checked from encoded headers before browser pixel decoding when the standard header exposes them, then checked again after decoding
- Large image work still runs on the main thread and does not currently provide cancellation

## Safe summary sentence

Use this when a short description is needed:

"LocalResizer is a browser-based tool for compressing, resizing, and converting supported static JPEG, PNG, and WebP images locally, with live pages for target-size, format-conversion, and exact social artwork workflows."

## Future-scope items to keep private for now

- GIF tools after real processing support is ready
- video tools after a separate workflow is built
- more platform-specific exact-size pages after the dimensions and behavior are actually published
- crop workflows after UX and behavior are finalized
