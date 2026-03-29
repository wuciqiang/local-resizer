# Why I Built an Image Compressor That Never Sees Your Images

Last week, a designer friend asked me to compress 50 product photos for their e-commerce site. They needed each under 200KB for fast loading. The usual workflow: upload to some online tool, wait, download, repeat.

I watched them work. Every image left their machine. Traveled to a server somewhere. Got processed. Came back. Fifty times.

"Where do these images go?" they asked.

I didn't know. Neither did they.

That's the problem I set out to fix.

## The Privacy Gap in Image Tools

Most image compression tools work the same way. You upload. They process. You download. Simple.

But simple isn't always right.

Your images contain metadata. Location data. Camera info. Sometimes faces. Sometimes documents. You're trusting a server you've never seen with data you can't get back.

The web can do better.

## Canvas API: The Hidden Power

Modern browsers ship with the Canvas API. It's been there for years. Developers use it for games, charts, animations.

It can also process images. Completely client-side.

No upload. No server. No trust required.

I built [LocalResizer](https://localresizer.com/) on this principle. Every image stays in your browser. The processing happens on your machine. Nothing leaves.

## The Technical Challenge

Client-side processing sounds simple. It's not.

### Problem 1: JPEG Quality Search

JPEG compression uses a quality parameter from 0 to 100. Higher quality means larger files. But the relationship isn't linear.

Quality 90 might give you 500KB. Quality 80 might give you 180KB. Quality 75 might give you 160KB.

You need 200KB exactly. What quality do you use?

Binary search solves this. Start at quality 50. Too big? Try 25. Too small? Try 37. Converge on the target.

```typescript
async function findTargetQuality(
  canvas: HTMLCanvasElement,
  targetBytes: number,
  format: string
): Promise<number> {
  let low = 0;
  let high = 100;
  let bestQuality = 100;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const blob = await canvasToBlob(canvas, format, mid / 100);

    if (blob.size <= targetBytes) {
      bestQuality = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestQuality;
}
```

This runs in your browser. No server needed.

### Problem 2: PNG Has No Quality Parameter

PNG is lossless. You can't adjust quality like JPEG. The file size is what it is.

Three strategies work:

1. **Re-encode**: Draw to canvas, export as PNG. Sometimes smaller due to compression differences.
2. **Convert to WebP**: Keep dimensions, switch format. Usually 30-50% smaller.
3. **Scale down**: Reduce dimensions until file size fits.

[LocalResizer](https://localresizer.com/compress-png-to-200kb) lets users choose. Some need PNG for transparency. Some can use WebP. The tool adapts.

### Problem 3: Exact Canvas Sizes

YouTube thumbnails must be exactly 1280×720. Instagram posts need 1080×1080. No flexibility.

But user images come in any ratio. 4:3, 16:9, 3:2, square, portrait.

The solution: contain and pad.

```typescript
function fitToCanvas(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): { width: number; height: number; x: number; y: number } {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  let drawWidth, drawHeight;

  if (sourceRatio > targetRatio) {
    drawWidth = targetWidth;
    drawHeight = targetWidth / sourceRatio;
  } else {
    drawHeight = targetHeight;
    drawWidth = targetHeight * sourceRatio;
  }

  return {
    width: drawWidth,
    height: drawHeight,
    x: (targetWidth - drawWidth) / 2,
    y: (targetHeight - drawHeight) / 2,
  };
}
```

The image fits. No cropping. No distortion. Padding fills the gaps.

## The Architecture Decision

I chose Astro for this project. Not React. Not Next.js. Astro.

Why?

The tool needs interactivity for image processing. But most of the site is static. Tool descriptions. FAQs. How-to guides.

Astro generates static HTML. It adds React only where needed. The image processor is a React island. Everything else is plain HTML.

Result: Fast load times. Good SEO. Interactive where it matters.

The routing system uses a single dynamic route:

```typescript
// src/pages/[slug].astro
export function getStaticPaths() {
  return activeRoutes.map(route => ({
    params: { slug: route.slug },
    props: { route },
  }));
}
```

One template. Multiple pages. Each with specific configs:

- [compress-jpeg-to-50kb](https://localresizer.com/compress-jpeg-to-50kb)
- [compress-jpeg-to-200kb](https://localresizer.com/compress-jpeg-to-200kb)
- [resize-youtube-thumbnail](https://localresizer.com/resize-youtube-thumbnail)

Same code. Different parameters. Programmatic SEO at work.

## What I Learned

### 1. Users Don't Trust "Local Processing"

Early feedback was skeptical. "How do I know it's really local?"

I added a network monitor suggestion. Open DevTools. Watch the Network tab. Process an image. No uploads appear.

Transparency builds trust.

### 2. Progress Bars Matter

Image processing takes time. Especially large files. Users need feedback.

I added progress tracking:

```typescript
async function compressImage(
  file: File,
  targetSize: number,
  onProgress: (percent: number) => void
): Promise<Blob> {
  onProgress(10); // Started
  const canvas = await loadToCanvas(file);
  onProgress(40); // Loaded
  const quality = await findTargetQuality(canvas, targetSize);
  onProgress(70); // Quality found
  const result = await canvasToBlob(canvas, 'image/jpeg', quality);
  onProgress(100); // Done
  return result;
}
```

Users see movement. They wait. They don't refresh.

### 3. Format Conversion Needs Explanation

When PNG converts to WebP, users get confused. "I uploaded PNG. Why is this WebP?"

I added format badges. Clear labels. Explanations.

The tool now shows:
- Input format
- Output format (if different)
- Why the conversion happened

Communication prevents confusion.

## The Performance Reality

Client-side processing has limits.

A 10MB image on a modern laptop? Fast. Same image on a phone? Slower.

The browser does the work. Your device provides the power.

But there's no network latency. No queue. No waiting for server capacity.

For most users, it's faster. For all users, it's private.

## What's Next

The current version handles JPEG, PNG, and WebP. Static images only.

Future plans:

- AVIF support (better compression, growing browser support)
- Batch processing improvements (parallel workers)
- Crop and rotate tools (still client-side)

No plans for:
- Server-side processing
- User accounts
- Cloud storage

The core principle stays: your images, your device, your privacy.

## Try It Yourself

[LocalResizer](https://localresizer.com/) is live and free. No signup. No tracking cookies. No image uploads.

The code is open source: [github.com/wuciqiang/local-resizer](https://github.com/wuciqiang/local-resizer)

Open DevTools. Watch the Network tab. Process an image. See for yourself.

The web can respect privacy. It just needs to try.

---

*Built with Astro 5, React 19, and the Canvas API. Deployed on Cloudflare Pages. Processing happens in your browser, not on my servers.*
