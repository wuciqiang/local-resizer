export type Action = 'compress' | 'resize';
export type Format = 'jpeg' | 'png' | 'webp';
export type Tier = 1 | 2 | 3 | 4;
export type ResizeMode = 'fit' | 'contain' | 'cover' | 'stretch';

export interface Dimensions {
  width: number;
  height: number;
}

export interface SEOMeta {
  title: string;
  description: string;
  h1: string;
  subtitle: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RouteConfig {
  slug: string;
  action: Action;
  format?: Format;
  targetSize?: string;
  targetSizeBytes?: number;
  platform?: string;
  asset?: string;
  dimensions?: Dimensions;
  tier: Tier;
  seo: SEOMeta;
  faq: FaqItem[];
  howToSteps: string[];
  relatedLinks: string[];
  acceptFormats: string[];
  maxFileSize: number;
  resizeMode?: ResizeMode;
  forceCanvasSize?: boolean;
}

const FORMATS: Format[] = ['jpeg', 'png', 'webp'];

const SIZE_TIERS_KB = [
  10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250, 300,
  350, 400, 450, 500, 600, 700, 800, 900, 1000, 1500, 2000,
];
const SIZE_TIERS_MB = [1, 2, 3, 4, 5, 8, 10];

const RESIZE_IMAGE_SIZES = [
  '20kb', '30kb', '50kb', '80kb', '100kb', '150kb', '200kb', '250kb', '300kb', '400kb',
  '500kb', '600kb', '800kb', '1mb', '1.5mb', '2mb', '3mb', '5mb', '8mb', '10mb',
];

interface PlatformAsset {
  platform: string;
  asset: string;
  width: number;
  height: number;
  maxFileSize?: number;
}

const PLATFORM_ASSETS: PlatformAsset[] = [
  { platform: 'youtube', asset: 'banner', width: 2560, height: 1440 },
  { platform: 'youtube', asset: 'thumbnail', width: 1280, height: 720 },
  { platform: 'youtube', asset: 'channel-art', width: 2560, height: 1440 },
  { platform: 'instagram', asset: 'post', width: 1080, height: 1080 },
  { platform: 'instagram', asset: 'story', width: 1080, height: 1920 },
  { platform: 'instagram', asset: 'profile-photo', width: 320, height: 320 },
  { platform: 'discord', asset: 'avatar', width: 128, height: 128 },
  { platform: 'discord', asset: 'emoji', width: 128, height: 128, maxFileSize: 256 * 1024 },
  { platform: 'discord', asset: 'banner', width: 960, height: 540 },
  { platform: 'twitter', asset: 'header', width: 1500, height: 500 },
  { platform: 'twitter', asset: 'profile-photo', width: 400, height: 400 },
  { platform: 'twitter', asset: 'post-image', width: 1200, height: 675 },
  { platform: 'facebook', asset: 'cover', width: 820, height: 312 },
  { platform: 'facebook', asset: 'profile', width: 170, height: 170 },
  { platform: 'facebook', asset: 'event-cover', width: 1200, height: 628 },
  { platform: 'linkedin', asset: 'banner', width: 1584, height: 396 },
  { platform: 'linkedin', asset: 'profile-photo', width: 400, height: 400 },
  { platform: 'tiktok', asset: 'profile-photo', width: 200, height: 200 },
  { platform: 'twitch', asset: 'banner', width: 1200, height: 480 },
  { platform: 'twitch', asset: 'profile', width: 256, height: 256 },
  { platform: 'twitch', asset: 'emote', width: 112, height: 112 },
  { platform: 'whatsapp', asset: 'profile', width: 500, height: 500 },
  { platform: 'telegram', asset: 'sticker', width: 512, height: 512 },
];

const MIME_MAP: Record<Format, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const STATIC_IMAGE_ACCEPT_FORMATS = Object.values(MIME_MAP);

export function parseSize(value: string): number {
  const lower = value.toLowerCase();
  const amount = Number.parseFloat(lower);
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid size value: ${value}`);
  }

  if (lower.endsWith('mb')) {
    return Math.round(amount * 1024 * 1024);
  }

  return Math.round(amount * 1024);
}

export function formatSizeLabel(value: string): string {
  return value.toUpperCase();
}

function formatLabel(format: Format): string {
  return format === 'jpeg' ? 'JPEG' : format.toUpperCase();
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

function assetLabel(value: string): string {
  return value.split('-').map(capitalize).join(' ');
}

function compressFaq(format: Format, size: string): FaqItem[] {
  const formatName = formatLabel(format);
  const sizeLabel = formatSizeLabel(size);

  if (format === 'png') {
    return [
      {
        question: `Does this page keep my ${formatName} as a PNG file?`,
        answer: `Yes. The tool keeps the output as PNG and reduces file size locally in your browser. Because PNG does not use the same quality slider as JPEG, the tool may reduce pixel dimensions to move toward ${sizeLabel}.`,
      },
      {
        question: `How close can a PNG get to ${sizeLabel}?`,
        answer: `The tool targets ${sizeLabel} as closely as practical while keeping PNG output. Results depend on the image content, so some files may land a little above or below the target.`,
      },
      {
        question: `What happens if my PNG is already smaller than ${sizeLabel}?`,
        answer: `If the image is already within the requested size budget, the original file is kept and no extra reduction is applied.`,
      },
      {
        question: `Why can the dimensions change on PNG pages?`,
        answer: `PNG size is strongly tied to the number of pixels. When a PNG needs a much smaller file size, reducing the canvas dimensions is often the most reliable way to get there without converting to another format.`,
      },
      {
        question: 'Is the PNG processed privately?',
        answer: 'Yes. Static image processing happens entirely in your browser. Nothing is uploaded to our servers.',
      },
    ];
  }

  return [
    {
      question: `How close can this tool get my ${formatName} to ${sizeLabel}?`,
      answer: `The tool targets ${sizeLabel} with a binary-search quality pass. Most images land very close to the requested size, and the result is usually within about five percent when the source image allows it.`,
    },
    {
      question: `Will compressing a ${formatName} to ${sizeLabel} lower image quality?`,
      answer: `Some quality reduction is expected when you ask for a smaller file. The tool searches for the lightest compression that still reaches the target size budget.`,
    },
    {
      question: `What happens if my ${formatName} is already smaller than ${sizeLabel}?`,
      answer: `The original file is kept. The page does not try to make already-small images smaller unless it needs to.`,
    },
    {
      question: `Can I compress more than one ${formatName} at a time?`,
      answer: `Yes. The current uploader accepts up to 20 static images in one batch and processes them one by one in your browser.`,
    },
    {
      question: 'Is this page private to use?',
      answer: 'Yes. All static image processing happens locally in the browser, with no server upload.',
    },
  ];
}

function resizeImageFaq(size: string): FaqItem[] {
  const sizeLabel = formatSizeLabel(size);
  return [
    {
      question: `How does this page resize an image toward ${sizeLabel}?`,
      answer: `The tool scales down the image dimensions and, for JPEG or WebP files, can fine-tune the output quality. That combination helps the result move toward the requested file-size budget.`,
    },
    {
      question: `Will the page stretch my image to reach ${sizeLabel}?`,
      answer: 'No. The image aspect ratio is preserved on these size-target pages. The tool makes the image smaller without distorting it.',
    },
    {
      question: `What happens if my image is already below ${sizeLabel}?`,
      answer: `The original file is kept so the page does not enlarge or recompress an image that is already under the target.`,
    },
    {
      question: 'Which files are supported here?',
      answer: 'These pages currently support static JPEG, PNG, and WebP images only.',
    },
    {
      question: `Can I resize multiple images toward ${sizeLabel} in one go?`,
      answer: 'Yes. The current uploader processes up to 20 static images in a single batch.',
    },
  ];
}

function platformFaq(platform: string, asset: string, width: number, height: number): FaqItem[] {
  const platformName = platformLabel(platform);
  const assetName = assetLabel(asset);
  return [
    {
      question: `Does this page output exactly ${width} x ${height} pixels?`,
      answer: `Yes. The exported image uses an exact ${width} x ${height} canvas so the final file matches the requested platform dimensions.`,
    },
    {
      question: `What happens if my source image ratio does not match the ${platformName} ${assetName} ratio?`,
      answer: `The tool keeps the whole image visible by fitting it inside the target canvas without distortion. If the ratios differ, padding may be added around the image.`,
    },
    {
      question: `Which files can I use for a ${platformName} ${assetName}?`,
      answer: 'The page currently supports static JPEG, PNG, and WebP images only.',
    },
    {
      question: `Does the page crop the image automatically?`,
      answer: 'No automatic cropping is applied on these platform pages. The current behavior keeps the full image visible on the exact output canvas.',
    },
    {
      question: 'Is the resize private?',
      answer: 'Yes. The image is resized locally in your browser and is never uploaded to our servers.',
    },
  ];
}

function buildCompressRoute(format: Format, size: string): RouteConfig {
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
      description: `Free online ${formatName} compressor to ${sizeLabel}. Process images in your browser with zero upload. Fast, private, and secure. Works offline after first load.`,
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


function buildRelatedLinks(routes: RouteConfig[]): void {
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

function pruneRelatedLinks(routes: RouteConfig[], allowedSlugs: string[]): void {
  const allowed = new Set(allowedSlugs);
  for (const route of routes) {
    route.relatedLinks = route.relatedLinks.filter((slug) => allowed.has(slug));
  }
}

export const PHASE0_SLUGS = [
  'compress-jpeg-to-50kb',
  'compress-jpeg-to-200kb',
  'compress-png-to-200kb',
  'resize-image-to-20kb',
  'resize-image-to-100kb',
  'resize-image-to-2mb',
  'resize-youtube-banner',
  'resize-youtube-thumbnail',
];

const ACTIVE_SLUGS = new Set(PHASE0_SLUGS);

function generateActiveRoutes(): RouteConfig[] {
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
          description: `Resize any image to ${sizeLabel} in your browser. Supports JPEG, PNG, WebP. No upload required. Privacy-first tool that works completely offline.`,
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

export const allRoutes: RouteConfig[] = generateActiveRoutes();

buildRelatedLinks(allRoutes);

export function getRouteBySlug(slug: string): RouteConfig | undefined {
  return allRoutes.find((route) => route.slug === slug);
}

export const phase0Routes = allRoutes;
pruneRelatedLinks(phase0Routes, PHASE0_SLUGS);
