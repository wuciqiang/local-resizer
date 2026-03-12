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
    return `Create an exact ${route.dimensions.width} x ${route.dimensions.height} ${platformName} ${assetName} image locally in your browser. The tool keeps the whole image visible on the target canvas and never uploads your file to a server.`;
  }

  if (route.action === 'compress' && route.format && route.targetSize) {
    const formatName = formatLabel(route.format);
    const sizeLabel = formatSizeLabel(route.targetSize);
    if (route.format === 'png') {
      return `Reduce PNG file size toward ${sizeLabel} locally while keeping PNG output. This page is designed for static images and works entirely inside your browser.`;
    }

    return `Compress a static ${formatName} image toward ${sizeLabel} locally. The tool searches for a lighter output that stays close to your target without sending the image anywhere.`;
  }

  if (route.targetSize) {
    const sizeLabel = formatSizeLabel(route.targetSize);
    return `Resize a static image toward ${sizeLabel} by reducing its dimensions locally in the browser. JPEG, PNG, and WebP files are supported on these pages.`;
  }

  return 'Resize and compress static images directly in your browser with no server upload.';
}

export function generateDetailText(route: RouteConfig): string {
  if (route.platform && route.asset && route.dimensions) {
    return `If your source image uses a different aspect ratio, the page fits it inside the exact output size without distortion. That means the final file always matches the requested canvas, while some padding can appear around the image when needed.`;
  }

  if (route.action === 'compress' && route.format && route.targetSize) {
    if (route.format === 'png') {
      return 'PNG files do not use the same lossy quality slider as JPEG or WebP. To move a PNG toward a much smaller file size, this tool may reduce the number of pixels while keeping the file in PNG format.';
    }

    return 'If the original image is already under the requested size, the page keeps the original file instead of forcing extra compression. For larger images, it uses a quality search to move the result as close to the target as practical.';
  }

  if (route.targetSize) {
    return 'These size-target pages preserve the original aspect ratio and avoid stretching the image. When the original file is already below the requested size budget, the page keeps it as-is instead of enlarging or needlessly recompressing it.';
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
    jpeg: 'JPEG is the most common format for photos and complex images. It uses lossy compression, which makes it a strong choice when you need a smaller file and can accept some controlled quality loss.',
    png: 'PNG is a lossless format with transparency support. It is a good fit for interface graphics, logos, and screenshots, but it often needs larger files than JPEG for photo-heavy images.',
    webp: 'WebP is a modern format that can produce smaller files than JPEG or PNG for many static images. It supports both lossy and lossless compression, plus transparency.',
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
