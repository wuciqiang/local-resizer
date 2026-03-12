# Current Public Capabilities

Last updated: March 12, 2026

This document defines what the live public site can claim today.

## Homepage claim set

- LocalResizer resizes and compresses static images in the browser.
- Supported public formats are JPEG, PNG, and WebP.
- Files are processed locally with no image upload to the server for the current tool flow.
- The homepage tool supports:
  - compress by file size
  - resize by dimensions

## Live tool-page claim set

The current public release includes 8 focused tool pages:

- `compress-jpeg-to-50kb`
- `compress-jpeg-to-200kb`
- `compress-png-to-200kb`
- `resize-image-to-20kb`
- `resize-image-to-100kb`
- `resize-image-to-2mb`
- `resize-youtube-banner`
- `resize-youtube-thumbnail`

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

### Resize-to-size pages

Allowed claims:

- Works with static JPEG, PNG, and WebP images
- Preserves the original aspect ratio
- Moves toward the requested file-size budget by reducing dimensions
- Keeps the original file if it is already below the target

Do not claim:

- exact target size on every image
- distortion-free enlargement to hit a target

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
- generic social-media page coverage beyond the currently live pages
- server-side processing
- account features
- cloud storage
- AI editing

## Safe summary sentence

Use this when a short description is needed:

"LocalResizer is a browser-based tool for compressing and resizing static JPEG, PNG, and WebP images locally, with live pages for target-size workflows and exact YouTube artwork canvases."

## Future-scope items to keep private for now

- GIF tools after real processing support is ready
- video tools after a separate workflow is built
- more platform-specific exact-size pages after they are actually published
- crop workflows after UX and behavior are finalized
