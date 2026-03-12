import type { Format, RouteConfig } from '../data/routes';
import { formatSizeLabel } from '../data/routes';

export interface PageHighlight {
  title: string;
  body: string;
}

export function generateIntroText(route: RouteConfig): string {
  if (route.platform && route.asset && route.dimensions) {
    const platformName = platformLabel(route.platform);
    const assetName = route.asset.split('-').map(capitalize).join(' ');
    return `Create an exact ${route.dimensions.width} x ${route.dimensions.height} ${platformName} ${assetName} image locally in your browser. This free online tool processes your images using the Canvas API, which means your files never leave your device. Perfect for content creators, social media managers, and designers who need pixel-perfect dimensions for ${platformName} without compromising privacy. The tool automatically handles aspect ratio adjustments and ensures your final image matches the platform's official specifications.`;
  }

  if (route.action === 'compress' && route.format && route.targetSize) {
    const formatName = formatLabel(route.format);
    const sizeLabel = formatSizeLabel(route.targetSize);
    const sizeBytes = route.targetSizeBytes!;

    if (route.format === 'png') {
      return `Reduce PNG file size toward ${sizeLabel} locally while keeping PNG output. This browser-based compression tool is designed for static images and works entirely offline after the first load. PNG uses lossless compression, so to achieve significant file size reduction, the tool may intelligently scale down pixel dimensions while preserving image quality. Ideal for web developers optimizing interface graphics, logos, and screenshots for faster page load times without sacrificing transparency support.`;
    }

    if (sizeBytes < 100 * 1024) {
      return `Compress ${formatName} images to ${sizeLabel} for email attachments, form uploads, and legacy systems with strict file size limits. This free online compressor uses advanced quality optimization to achieve the target file size while maintaining acceptable visual quality. Perfect for sharing photos via email (most providers limit attachments to 10-25MB total), uploading to government portals with size restrictions, or preparing images for bandwidth-constrained environments. All processing happens in your browser using the Canvas API—no server upload required.`;
    }

    if (sizeBytes < 500 * 1024) {
      return `Compress ${formatName} images to ${sizeLabel} for optimal web performance and SEO. This file size range delivers excellent visual quality while significantly improving page load times—a critical factor for Core Web Vitals and search engine rankings. Ideal for blog post featured images, e-commerce product photos, portfolio thumbnails, and CMS uploads. Many platforms like WordPress recommend keeping images under ${sizeLabel} for best performance. This browser-based tool processes images locally, ensuring complete privacy and instant results without server delays.`;
    }

    return `Compress ${formatName} images to ${sizeLabel} while preserving high visual quality for professional use. This tool is designed for photographers preparing client galleries, designers creating high-resolution portfolio pieces, and content creators who need to balance file size with image fidelity. The compression algorithm uses intelligent quality optimization to achieve the target size without introducing visible artifacts. All processing happens locally in your browser—your images never touch our servers, ensuring complete privacy and security.`;
  }

  if (route.targetSize) {
    const sizeLabel = formatSizeLabel(route.targetSize);
    return `Resize images to ${sizeLabel} by intelligently scaling dimensions and optimizing compression. This free browser-based tool supports JPEG, PNG, and WebP formats, making it perfect for web developers, bloggers, and content creators who need to meet specific file size requirements. The tool preserves aspect ratios to prevent distortion and uses format-specific optimization strategies—quality adjustment for JPEG/WebP, dimension scaling for PNG. Ideal for CMS uploads, email attachments, and mobile app assets where file size directly impacts performance and user experience.`;
  }

  return 'Resize and compress static images directly in your browser with no server upload.';
}

export function generateDetailText(route: RouteConfig): string {
  if (route.platform && route.asset && route.dimensions) {
    return `If your source image uses a different aspect ratio, the page fits it inside the exact output size without distortion. That means the final file always matches the requested canvas dimensions, while some padding may appear around the image when needed. This approach ensures your ${route.platform} ${route.asset} meets platform specifications without cropping important content. The tool uses the Canvas API's "contain" mode to preserve the entire image, making it ideal for logos, graphics, and photos where every pixel matters. For best results, prepare your source image with an aspect ratio close to the target dimensions to minimize padding.`;
  }

  if (route.action === 'compress' && route.format && route.targetSize) {
    const sizeBytes = route.targetSizeBytes!;

    if (route.format === 'png') {
      return `PNG files do not use the same lossy quality slider as JPEG or WebP. To move a PNG toward a much smaller file size, this tool may reduce the number of pixels while keeping the file in PNG format. This approach preserves PNG's lossless compression and transparency support—critical for interface graphics, logos, and screenshots. The algorithm intelligently scales dimensions to achieve the target file size while maintaining visual clarity. If your PNG is already below the target size, the original file is preserved without unnecessary recompression. This makes the tool safe for iterative workflows where you might process the same image multiple times.`;
    }

    if (sizeBytes < 100 * 1024) {
      return `If the original image is already under the requested size, the page keeps the original file instead of forcing extra compression. For larger images, it uses a binary-search quality optimization algorithm to find the lightest compression that still reaches the target size. This approach minimizes quality loss while ensuring consistent file sizes—essential for email attachments (where providers often reject messages over 25MB), form uploads with hard limits, and legacy systems that can't handle large files. The tool typically achieves results within 5% of the target size, making it reliable for strict requirements.`;
    }

    if (sizeBytes < 500 * 1024) {
      return `If the original image is already under the requested size, the page keeps the original file instead of forcing extra compression. For larger images, it uses a quality search to move the result as close to the target as practical. This file size range is optimal for web performance—Google's Core Web Vitals recommend keeping images under 500KB for good Largest Contentful Paint (LCP) scores. The compression algorithm balances visual quality with file size, making it perfect for blog featured images, product photos, and portfolio pieces where both aesthetics and performance matter. Most users won't notice quality differences at this compression level, especially for photos and complex images.`;
    }

    return `If the original image is already under the requested size, the page keeps the original file instead of forcing extra compression. For larger images, it uses a quality search to move the result as close to the target as practical. At this file size range, the tool prioritizes visual quality while still achieving meaningful size reduction. This makes it ideal for professional photography, high-resolution portfolio pieces, and print-ready images where detail preservation is critical. The compression algorithm uses format-specific optimizations—JPEG's DCT quantization and WebP's advanced prediction modes—to maximize quality at the target file size.`;
  }

  if (route.targetSize) {
    return `These size-target pages preserve the original aspect ratio and avoid stretching the image. When the original file is already below the requested size budget, the page keeps it as-is instead of enlarging or needlessly recompressing it. The tool combines dimension scaling with format-specific compression: for JPEG and WebP, it adjusts both dimensions and quality parameters; for PNG, it primarily scales dimensions since PNG doesn't support lossy quality adjustment. This intelligent approach ensures optimal results for each format while maintaining visual integrity. Perfect for responsive web design where you need multiple image sizes, or for meeting CMS upload requirements without manual trial-and-error.`;
  }

  return 'The current tool set is focused on static JPEG, PNG, and WebP workflows only.';
}

export function generatePageHighlights(route: RouteConfig): PageHighlight[] {
  if (route.platform && route.asset && route.dimensions) {
    const platformName = platformLabel(route.platform);
    const assetName = route.asset.split('-').map(capitalize).join(' ');
    const sizeLabel = `${route.dimensions.width} x ${route.dimensions.height}`;

    return [
      {
        title: 'Best for',
        body: `Use this page when you need a live ${platformName} ${assetName} asset that matches the current ${sizeLabel} canvas size.`,
      },
      {
        title: 'Output behavior',
        body: `The exported file uses an exact ${sizeLabel} canvas. The page keeps the whole image visible inside that frame and may add padding when the source ratio does not match.`,
      },
      {
        title: 'Current limits',
        body: 'The current platform workflow does not auto-crop or create alternate safe-area versions. It is built for static JPEG, PNG, and WebP uploads only.',
      },
    ];
  }

  if (route.action === 'compress' && route.format && route.targetSize) {
    const formatName = formatLabel(route.format);
    const sizeLabel = formatSizeLabel(route.targetSize);

    if (route.format === 'png') {
      return [
        {
          title: 'Best for',
          body: `Use this page when you need a PNG that stays in PNG format while moving toward a ${sizeLabel} budget.`,
        },
        {
          title: 'Output behavior',
          body: `The page keeps PNG output, keeps the original file if it is already small enough, and may reduce pixel dimensions when that is the most reliable way to shrink the file.`,
        },
        {
          title: 'Current limits',
          body: 'PNG results are still best-effort. The exact final size is not guaranteed, and pixel dimensions may change when the image needs a much smaller file size.',
        },
      ];
    }

    return [
      {
        title: 'Best for',
        body: `Use this page when you need a lighter ${formatName} file for uploads, forms, or content systems with a ${sizeLabel} limit.`,
      },
      {
        title: 'Output behavior',
        body: `The page keeps ${formatName} output, searches for a lighter result near the target, and keeps the original file when the image is already under the requested size budget.`,
      },
      {
        title: 'Current limits',
        body: 'Compression is still best-effort. The exact final size is not guaranteed on every image, and visible quality can change when the target is aggressive.',
      },
    ];
  }

  if (route.targetSize) {
    const sizeLabel = formatSizeLabel(route.targetSize);

    return [
      {
        title: 'Best for',
        body: `Use this page when you need a static image that is smaller overall and closer to a ${sizeLabel} file-size budget.`,
      },
      {
        title: 'Output behavior',
        body: 'The page reduces image dimensions while preserving the original aspect ratio. JPEG and WebP results can also use extra compression when needed, and already-small files keep the original file.',
      },
      {
        title: 'Current limits',
        body: 'These resize-to-size pages are best-effort. They do not enlarge images, they do not stretch the aspect ratio, and they cannot guarantee an exact final size on every file.',
      },
    ];
  }

  return [
    {
      title: 'Best for',
      body: 'Use this page for static-image workflows that fit the currently published public toolset.',
    },
    {
      title: 'Output behavior',
      body: 'The current public tools process static images locally in the browser with no server upload.',
    },
    {
      title: 'Current limits',
      body: 'The live release is limited to static JPEG, PNG, and WebP workflows.',
    },
  ];
}

export function generateFormatInfo(format: Format): string {
  const info: Record<Format, string> = {
    jpeg: 'JPEG is the most common format for photos and complex images. It uses lossy compression, which makes it a strong choice when you need a smaller file and can accept some controlled quality loss. JPEG excels at compressing photographs and images with gradients, achieving file sizes 50-80% smaller than PNG for the same visual quality. However, JPEG does not support transparency and can introduce compression artifacts in images with sharp edges or text. Best for: product photos, blog images, portraits, and any photographic content where file size matters more than pixel-perfect accuracy.',
    png: 'PNG is a lossless format with transparency support. It is a good fit for interface graphics, logos, and screenshots, but it often needs larger files than JPEG for photo-heavy images. PNG preserves every pixel exactly as it was, making it ideal for graphics that will be edited multiple times or require transparency layers. The format uses DEFLATE compression, which works best on images with large areas of solid color. PNG-8 supports 256 colors with smaller file sizes, while PNG-24 supports millions of colors. Best for: logos, icons, interface elements, screenshots, and any image requiring transparency or lossless quality.',
    webp: 'WebP is a modern format that can produce smaller files than JPEG or PNG for many static images. It supports both lossy and lossless compression, plus transparency. Developed by Google, WebP typically achieves 25-35% smaller file sizes than JPEG at equivalent quality levels, and 26% smaller than PNG for lossless images. WebP uses advanced compression techniques including predictive coding and variable block sizes. Browser support is now excellent (95%+ globally), making it a strong choice for modern web development. Best for: web optimization, responsive images, e-commerce product photos, and any scenario where you need the smallest possible file size with good quality.',
  };

  return info[format];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function platformLabel(value: string): string {
  const labels: Record<string, string> = {
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    whatsapp: 'WhatsApp',
  };

  return labels[value] ?? capitalize(value);
}

function formatLabel(format: Format): string {
  return format === 'jpeg' ? 'JPEG' : format.toUpperCase();
}
