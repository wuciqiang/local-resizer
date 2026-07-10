import type { RouteConfig } from '../../data/routes';
import {
  assetLabel,
  formatLabel,
  formatSizeLabel,
  platformLabel,
} from '../../data/routes';

export function generateIntroText(route: RouteConfig): string {
  if (route.intent === 'document-photo' && route.targetSize === '20kb') {
    return 'Resize a static photo toward a 20KB upload limit directly in your browser. This page is meant for users who know the real constraint is a very small file-size budget, but who still want a simple local workflow instead of repeated manual trial and error. The current tool supports static JPEG, PNG, and WebP images only, keeps processing local to your device, and does not require signup or server upload.';
  }

  if (route.intent === 'generic-compress' && route.format === 'jpeg') {
    return 'Compress a JPG or JPEG image locally in your browser by choosing the target size that fits your upload rule. This page is designed for people who know they need a smaller JPEG, but do not want to jump between separate fixed-size pages before deciding whether 50KB, 100KB, or 200KB is the better target. The result stays JPEG, and the current public workflow never uploads image content to a server.';
  }

  if (route.intent === 'generic-compress' && route.targetSize && !route.format) {
    const sizeLabel = formatSizeLabel(route.targetSize);
    if (route.targetSize === '500kb') {
      return 'Compress or convert an image to 500KB directly in your browser. This page is for forms, profile uploads, product photos, and document portals that reject files above a 500KB limit. Upload a static JPEG, PNG, or WebP file, let the local tool move it toward the target, and download the result without sending the image to a server.';
    }

    return `Compress a static image toward ${sizeLabel} locally in your browser. This page is for users who know the upload gate is a file-size budget, but the source image might be JPEG, PNG, or WebP. The workflow keeps processing on your device, uses format-specific reduction strategies, and treats the final file size as best-effort rather than a guaranteed exact byte count.`;
  }

  if (route.intent === 'format-resize' && route.format === 'png') {
    return 'Resize a static PNG by pixel dimensions directly in your browser with no upload. This page is useful when the real requirement is a PNG-specific resize workflow rather than a generic file-size target. It keeps PNG output, supports custom width and height values, and fits the image to the requested dimensions without stretching it out of proportion.';
  }

  if (route.platform && route.asset && route.dimensions) {
    const platformName = platformLabel(route.platform);
    const assetName = assetLabel(route.asset);
    return `Create an exact ${route.dimensions.width} x ${route.dimensions.height} ${platformName} ${assetName} canvas locally in your browser. This page is for creators, marketers, and designers who need a predictable platform-sized export without uploading the source image. The current workflow keeps the full image visible inside the target canvas, preserves privacy, and may add padding when the source ratio does not match.`;
  }

  if (route.action === 'compress' && route.format && route.targetSize) {
    const formatName = formatLabel(route.format);
    const sizeLabel = formatSizeLabel(route.targetSize);
    const sizeBytes = route.targetSizeBytes!;

    if (route.format === 'png') {
      return `Reduce PNG file size toward ${sizeLabel} locally while keeping PNG output. This browser-based compression tool is designed for static images and runs directly in your browser with no server upload. PNG uses lossless compression, so to achieve significant file size reduction, the tool may intelligently scale down pixel dimensions while preserving image quality. Ideal for web developers optimizing interface graphics, logos, and screenshots for faster page load times without sacrificing transparency support.`;
    }

    if (sizeBytes < 100 * 1024) {
      return `Compress ${formatName} images to ${sizeLabel} for email attachments, form uploads, and legacy systems with strict file size limits. This free online compressor uses advanced quality optimization to achieve the target file size while maintaining acceptable visual quality. Perfect for sharing photos via email (most providers limit attachments to 10-25MB total), uploading to government portals with size restrictions, or preparing images for bandwidth-constrained environments. All processing happens in your browser using the Canvas API—no server upload required.`;
    }

    if (sizeBytes < 500 * 1024) {
      return `Compress ${formatName} images to ${sizeLabel} for web pages, CMS uploads, product images, portfolio thumbnails, and other workflows where the original file is heavier than it needs to be. This browser-based tool processes images locally, uses a best-effort quality search, and keeps privacy central by avoiding image-content uploads to a server.`;
    }

    return `Compress ${formatName} images toward ${sizeLabel} for workflows that need a smaller static file while retaining as much usable detail as the source and target allow. The tool uses a best-effort quality search, and the visible result still depends on the original image. Processing stays in the browser with no image-content upload to our server.`;
  }

  if (route.targetSize) {
    const sizeLabel = formatSizeLabel(route.targetSize);
    if (route.targetSize === '20kb') {
      return 'Resize image to 20KB when a form or upload page has a very small file-size limit. The tool runs locally in your browser, supports static JPEG, PNG, and WebP files, and preserves aspect ratios so the result is not stretched. A 20KB target is strict, so the final quality depends heavily on the source image.';
    }

    return `Resize images to ${sizeLabel} by intelligently scaling dimensions and optimizing compression. This free browser-based tool supports JPEG, PNG, and WebP formats, and it works locally with no server upload required. The tool preserves aspect ratios to prevent distortion and uses format-specific optimization strategies—quality adjustment for JPEG/WebP, dimension scaling for PNG. Ideal for CMS uploads, email attachments, and mobile app assets where file size directly impacts performance and user experience.`;
  }

  return 'Resize and compress static images directly in your browser with no server upload.';
}

export function generateDetailText(route: RouteConfig): string {
  if (route.intent === 'document-photo' && route.targetSize === '20kb') {
    return 'This page uses the same best-effort target-size workflow as the current 20KB resize route. If the original image is already under 20KB, the original file is kept. If the image needs more reduction, the page can scale dimensions and apply format-specific compression to move closer to the target. That makes it useful for strict upload limits, but it is not an official passport, ID, visa, government, or exam compliance checker, and it does not automatically crop a portrait into a certified document-photo layout.';
  }

  if (route.intent === 'generic-compress' && route.format === 'jpeg') {
    return 'Because this is a configurable JPG compressor page, you can choose the size budget that matches the real upload gate instead of relying on a single fixed-size preset. The output remains JPEG, and the tool uses a quality-search pass to move as close as practical to the requested target size. If the original JPG is already below the target, the page keeps the original file. The result is still best-effort, so exact byte-for-byte guarantees are outside the current public promise.';
  }

  if (route.intent === 'generic-compress' && route.targetSize && !route.format) {
    const sizeLabel = formatSizeLabel(route.targetSize);
    if (route.targetSize === '500kb') {
      return 'If the original file is already under 500KB, the page keeps it as-is. If it is larger, the tool uses the current local compression workflow to get as close as practical to the 500KB budget. JPEG and WebP can use quality adjustment; PNG may need dimension changes because PNG does not shrink like a lossy photo format. The result is best-effort, not an exact byte guarantee.';
    }

    return `This page accepts static JPEG, PNG, and WebP files and moves them toward ${sizeLabel} without uploading image content to a server. JPEG and WebP can use quality adjustment, while PNG may need a PNG-specific strategy because it does not compress like a lossy photo format. If the original image is already under ${sizeLabel}, the original file is kept. The page does not support GIF, PDF, video, audio, or document compression.`;
  }

  if (route.intent === 'format-resize' && route.format === 'png') {
    return 'The current PNG resize page focuses on pixel dimensions rather than a file-size budget. The page keeps PNG output, which means transparency remains in the normal PNG export path. Unlike exact-canvas platform pages, this workflow does not force an exact canvas with padding. Instead, it scales the PNG to fit within the dimensions you enter while preserving the image aspect ratio. It does not add PDF, SVG, GIF, or smart-editing support beyond the current static-image toolset.';
  }

  if (route.platform && route.asset && route.dimensions) {
    return `If your source image uses a different aspect ratio, the page fits it inside the exact output size without distortion. That means the final file always matches the requested canvas dimensions, while some padding may appear around the image when needed. The tool uses the Canvas API's contain mode to preserve the entire image, making it useful for logos, graphics, and photos where cropping important content would be risky. For best results, prepare your source image with an aspect ratio close to the target dimensions to minimize padding.`;
  }

  if (route.action === 'compress' && route.format && route.targetSize) {
    const sizeBytes = route.targetSizeBytes!;

    if (route.format === 'png') {
      return `PNG files do not use the same lossy quality slider as JPEG or WebP. To move a PNG toward a much smaller file size, this tool may reduce the number of pixels while keeping the file in PNG format. This approach preserves PNG's lossless compression and transparency support—critical for interface graphics, logos, and screenshots. The algorithm intelligently scales dimensions to achieve the target file size while maintaining visual clarity. If your PNG is already below the target size, the original file is preserved without unnecessary recompression. This makes the tool safe for iterative workflows where you might process the same image multiple times.`;
    }

    if (sizeBytes < 100 * 1024) {
      return `If the original image is already under the requested size, the page keeps the original file instead of forcing extra compression. For larger images, it uses a quality search to find a result at or below the target when the source permits. The final quality and distance below the target still depend on the source image, so users should inspect the downloaded result before submitting it to a strict upload form.`;
    }

    if (sizeBytes < 500 * 1024) {
      return `If the original image is already under the requested size, the page keeps the original file instead of forcing extra compression. For larger images, it uses a quality search to move the result as close to the target as practical. This file-size range is useful for blog featured images, product photos, and portfolio pieces where both visual quality and page weight matter. The exact result still depends on the source image, format, and how much detail the file contains.`;
    }

    return `If the original image is already under the requested size, the page keeps the original file instead of forcing extra compression. For larger images, it uses a quality search to move the result as close to the target as practical. At this file size range, the tool prioritizes visual quality while still achieving meaningful size reduction. This makes it ideal for professional photography, high-resolution portfolio pieces, and print-ready images where detail preservation is critical. The compression algorithm uses format-specific optimizations—JPEG's DCT quantization and WebP's advanced prediction modes—to maximize quality at the target file size.`;
  }

  if (route.targetSize) {
    if (route.targetSize === '20kb') {
      return 'If the source image is already below 20KB, the original file is kept. If it is larger, the page can scale dimensions and apply format-specific compression to move toward the target. This is useful for strict upload gates, but the page is not an official passport, ID, exam, or government photo validator, and it cannot guarantee that every source image will land at exactly 20KB.';
    }

    return `These size-target pages preserve the original aspect ratio and avoid stretching the image. When the original file is already below the requested size budget, the page keeps it as-is instead of enlarging or needlessly recompressing it. The workflow reduces pixel dimensions first and can use format-specific compression for JPEG and WebP, while PNG primarily relies on dimension changes. Results remain source-dependent and should be checked before use.`;
  }

  return 'The current tool set is focused on static JPEG, PNG, and WebP workflows only.';
}
