import {
  ACTIVE_SLUGS,
  FORMATS,
  MIME_MAP,
  PLATFORM_ASSETS,
  RESIZE_IMAGE_SIZES,
  SIZE_TIERS_KB,
  SIZE_TIERS_MB,
  STATIC_IMAGE_ACCEPT_FORMATS,
} from './route-constants';
import { compressFaq, platformFaq, resizeImageFaq } from './route-faq';
import {
  assetLabel,
  formatLabel,
  formatSizeLabel,
  parseSize,
  platformLabel,
} from './route-formatters';
import type { Format, RouteConfig } from './route-types';

export function buildCompressRoute(format: Format, size: string): RouteConfig {
  const formatName = formatLabel(format);
  const sizeLabel = formatSizeLabel(size);
  const isPng = format === 'png';

  return {
    slug: `compress-${format}-to-${size}`,
    action: 'compress',
    format,
    targetSize: size,
    targetSizeBytes: parseSize(size),
    tier: 4,
    seo: {
      title: `Compress ${formatName} to ${sizeLabel} Online Free - No Upload | LocalResizer`,
      description: `Free online ${formatName} compressor to ${sizeLabel}. Process images locally in your browser with zero upload. Fast, private, and secure.`,
      h1: `Compress ${formatName} to ${sizeLabel}`,
      subtitle: isPng
        ? `Reduce PNG file size toward ${sizeLabel} locally while keeping PNG output.`
        : `Target a ${sizeLabel} ${formatName} output locally with no server upload.`,
    },
    faq: compressFaq(format, size),
    howToSteps: [
      `Upload your static ${formatName} image`,
      `Process the file toward the ${sizeLabel} target`,
      'Download the optimized result',
    ],
    relatedLinks: [],
    acceptFormats: [MIME_MAP[format]],
    maxFileSize: 50 * 1024 * 1024,
  };
}

export function buildRelatedLinks(routes: RouteConfig[]): void {
  const byFormat = new Map<string, RouteConfig[]>();
  const bySize = new Map<string, RouteConfig[]>();
  const byPlatform = new Map<string, RouteConfig[]>();

  for (const route of routes) {
    if (route.format) {
      const items = byFormat.get(route.format) ?? [];
      items.push(route);
      byFormat.set(route.format, items);
    }

    if (route.targetSize) {
      const items = bySize.get(route.targetSize) ?? [];
      items.push(route);
      bySize.set(route.targetSize, items);
    }

    if (route.platform) {
      const items = byPlatform.get(route.platform) ?? [];
      items.push(route);
      byPlatform.set(route.platform, items);
    }
  }

  for (const route of routes) {
    const links = new Set<string>();

    if (route.format) {
      for (const other of byFormat.get(route.format) ?? []) {
        if (other.slug !== route.slug) {
          links.add(other.slug);
        }
        if (links.size >= 4) {
          break;
        }
      }
    }

    if (route.targetSize) {
      for (const other of bySize.get(route.targetSize) ?? []) {
        if (other.slug !== route.slug) {
          links.add(other.slug);
        }
        if (links.size >= 8) {
          break;
        }
      }
    }

    if (route.platform) {
      for (const other of byPlatform.get(route.platform) ?? []) {
        if (other.slug !== route.slug) {
          links.add(other.slug);
        }
        if (links.size >= 12) {
          break;
        }
      }
    }

    route.relatedLinks = Array.from(links).slice(0, 12);
  }
}

export function pruneRelatedLinks(routes: RouteConfig[], allowedSlugs: string[]): void {
  const allowed = new Set(allowedSlugs);
  for (const route of routes) {
    route.relatedLinks = route.relatedLinks.filter((slug) => allowed.has(slug));
  }
}

export function generateActiveRoutes(): RouteConfig[] {
  const routes: RouteConfig[] = [];

  for (const format of FORMATS) {
    const allSizes = [
      ...SIZE_TIERS_KB.map((size) => `${size}kb`),
      ...SIZE_TIERS_MB.map((size) => `${size}mb`),
    ];
    for (const size of allSizes) {
      const slug = `compress-${format}-to-${size}`;
      if (ACTIVE_SLUGS.has(slug)) {
        routes.push(buildCompressRoute(format, size));
      }
    }
  }

  for (const size of RESIZE_IMAGE_SIZES) {
    const slug = `resize-image-to-${size}`;
    if (ACTIVE_SLUGS.has(slug)) {
      const sizeLabel = formatSizeLabel(size);
      routes.push({
        slug,
        action: 'resize',
        targetSize: size,
        targetSizeBytes: parseSize(size),
        tier: 4,
        seo: {
          title: `Resize Image to ${sizeLabel} Online Free - Browser Tool | LocalResizer`,
          description: `Resize any image to ${sizeLabel} in your browser. Supports JPEG, PNG, WebP. No upload required. Privacy-first local processing with no server upload.`,
          h1: `Resize Image to ${sizeLabel}`,
          subtitle: `Target a ${sizeLabel} file-size budget locally while keeping the image usable.`,
        },
        faq: resizeImageFaq(size),
        howToSteps: [
          'Upload a static JPEG, PNG, or WebP image',
          `Resize the image toward the ${sizeLabel} target`,
          'Download the resized result',
        ],
        relatedLinks: [],
        acceptFormats: STATIC_IMAGE_ACCEPT_FORMATS,
        maxFileSize: 50 * 1024 * 1024,
      });
    }
  }

  for (const asset of PLATFORM_ASSETS) {
    const slug = `resize-${asset.platform}-${asset.asset}`;
    if (ACTIVE_SLUGS.has(slug)) {
      const platformName = platformLabel(asset.platform);
      const assetName = assetLabel(asset.asset);
      routes.push({
        slug,
        action: 'resize',
        platform: asset.platform,
        asset: asset.asset,
        dimensions: { width: asset.width, height: asset.height },
        tier: 4,
        seo: {
          title: `${platformName} ${assetName} Size: ${asset.width}x${asset.height} Resizer - Free Tool | LocalResizer`,
          description: `Create perfect ${asset.width}x${asset.height} ${platformName} ${assetName} images in your browser. No upload, no signup. Privacy-first resizer for social media assets.`,
          h1: `Resize ${platformName} ${assetName} to ${asset.width} x ${asset.height}`,
          subtitle: `Export an exact ${asset.width} x ${asset.height} canvas locally with no server upload.`,
        },
        faq: platformFaq(asset.platform, asset.asset, asset.width, asset.height),
        howToSteps: [
          'Upload a static image',
          `Create the exact ${asset.width} x ${asset.height} output canvas`,
          'Download the final file',
        ],
        relatedLinks: [],
        acceptFormats: STATIC_IMAGE_ACCEPT_FORMATS,
        maxFileSize: asset.maxFileSize ?? 50 * 1024 * 1024,
        resizeMode: 'cover',
        forceCanvasSize: true,
      });
    }
  }

  return routes;
}
