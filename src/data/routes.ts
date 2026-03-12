export type Action = 'compress' | 'resize';
export type Format = 'jpeg' | 'png' | 'webp' | 'gif';
export type Tier = 1 | 2 | 3 | 4;

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
}

const FORMATS: Format[] = ['jpeg', 'png', 'webp', 'gif'];

const SIZE_TIERS_KB = [10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100,
  120, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900,
  1000, 1500, 2000];
const SIZE_TIERS_MB = [1, 2, 3, 4, 5, 8, 10];

const RESIZE_IMAGE_SIZES = [
  '20kb','30kb','50kb','80kb','100kb','150kb','200kb','250kb','300kb','400kb',
  '500kb','600kb','800kb','1mb','1.5mb','2mb','3mb','5mb','8mb','10mb',
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
  { platform: 'discord', asset: 'gif', width: 256, height: 256, maxFileSize: 8 * 1024 * 1024 },
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
  jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
};

export function parseSize(s: string): number {
  const lower = s.toLowerCase();
  const num = parseFloat(lower);
  if (lower.endsWith('mb')) return Math.round(num * 1024 * 1024);
  return Math.round(num * 1024);
}

export function formatSizeLabel(s: string): string {
  return s.toUpperCase().replace('KB', 'KB').replace('MB', 'MB');
}

function formatLabel(f: Format): string {
  return f === 'jpeg' ? 'JPEG' : f.toUpperCase();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function assetLabel(s: string): string {
  return s.split('-').map(capitalize).join(' ');
}

function compressFaq(fmt: string, size: string): FaqItem[] {
  const fl = formatLabel(fmt as Format);
  const sl = formatSizeLabel(size);
  return [
    { question: `Will compressing my ${fl} to ${sl} reduce quality?`, answer: `Our tool uses intelligent quality optimization to reach ${sl} with minimal visible quality loss. The algorithm finds the best balance between file size and visual fidelity.` },
    { question: `How accurate is the ${sl} target?`, answer: `The compression targets ${sl} within ±5% accuracy. The binary search algorithm iterates until the output is as close to ${sl} as possible.` },
    { question: `Can I compress multiple ${fl} files to ${sl} at once?`, answer: `Yes, you can upload up to 20 images and compress them all to ${sl} in batch. Each file is processed independently in your browser.` },
    { question: `Is it safe to compress images on this site?`, answer: `Absolutely. All processing happens 100% in your browser. Your files never leave your device — no server upload, no data collection.` },
    { question: `What if my ${fl} is already smaller than ${sl}?`, answer: `If your file is already under ${sl}, the tool will notify you. There's no need to compress further.` },
  ];
}

function resizeImageFaq(size: string): FaqItem[] {
  const sl = formatSizeLabel(size);
  return [
    { question: `How does resizing an image to ${sl} work?`, answer: `The tool proportionally scales your image dimensions down, then optimizes quality to reach exactly ${sl}. Aspect ratio is preserved by default.` },
    { question: `Will resizing to ${sl} affect image quality?`, answer: `Some quality reduction is expected when targeting a smaller file size. Our algorithm minimizes quality loss while meeting the ${sl} target.` },
    { question: `What image formats are supported?`, answer: `You can resize JPEG, PNG, WebP, and GIF images. The output format matches your input by default.` },
    { question: `Can I resize multiple images to ${sl}?`, answer: `Yes, batch processing supports up to 20 images at once. Each is resized to ${sl} independently.` },
  ];
}

function platformFaq(platform: string, asset: string, w: number, h: number): FaqItem[] {
  const pl = capitalize(platform);
  const al = assetLabel(asset);
  return [
    { question: `What is the recommended ${pl} ${al} size?`, answer: `${pl} recommends ${w}×${h} pixels for ${al.toLowerCase()}. Our tool resizes your image to exactly these dimensions.` },
    { question: `What file formats does ${pl} accept for ${al.toLowerCase()}?`, answer: `${pl} accepts JPEG, PNG, and WebP for most image uploads. GIF is supported for animated content where applicable.` },
    { question: `Will my ${al.toLowerCase()} look blurry after resizing?`, answer: `Our tool uses high-quality resampling. For best results, start with an image at least as large as ${w}×${h} pixels.` },
    { question: `Is this tool free to use?`, answer: `Yes, completely free with no watermarks. All processing happens in your browser — no account or payment required.` },
  ];
}

// PLACEHOLDER_ROUTE_GENERATORS

function generateCompressRoutes(): RouteConfig[] {
  const routes: RouteConfig[] = [];
  for (const fmt of FORMATS) {
    const fl = formatLabel(fmt);
    const allSizes = [
      ...SIZE_TIERS_KB.map(k => `${k}kb`),
      ...SIZE_TIERS_MB.map(m => `${m}mb`),
    ];
    for (const size of allSizes) {
      const sl = formatSizeLabel(size);
      const slug = `compress-${fmt}-to-${size}`;
      routes.push({
        slug,
        action: 'compress',
        format: fmt,
        targetSize: size,
        targetSizeBytes: parseSize(size),
        tier: 4,
        seo: {
          title: `Compress ${fl} to ${sl} — Free Online Tool | LocalResizer`,
          description: `Free online tool to compress ${fl} to ${sl}. No upload needed — processed 100% in your browser. Fast, secure, and private.`,
          h1: `Compress ${fl} to ${sl} Instantly`,
          subtitle: `Free, fast, 100% in-browser. Your files never leave your device.`,
        },
        faq: compressFaq(fmt, size),
        howToSteps: [
          `Upload your ${fl} image`,
          `Set target size to ${sl} and click Process`,
          `Download your optimized file`,
        ],
        relatedLinks: [],
        acceptFormats: [MIME_MAP[fmt]],
        maxFileSize: 50 * 1024 * 1024,
      });
    }
  }
  return routes;
}

function generateResizeImageRoutes(): RouteConfig[] {
  return RESIZE_IMAGE_SIZES.map(size => {
    const sl = formatSizeLabel(size);
    return {
      slug: `resize-image-to-${size}`,
      action: 'resize' as Action,
      targetSize: size,
      targetSizeBytes: parseSize(size),
      tier: 4 as Tier,
      seo: {
        title: `Resize Image to ${sl} Online Free | LocalResizer`,
        description: `Free online tool to resize image to ${sl}. No upload needed — processed 100% in your browser. Fast, secure, and private.`,
        h1: `Resize Image to ${sl}`,
        subtitle: `Resize any image to ${sl}. 100% free, 100% private.`,
      },
      faq: resizeImageFaq(size),
      howToSteps: [
        'Upload your image (JPEG, PNG, WebP, or GIF)',
        `Set target size to ${sl} and click Process`,
        'Download your resized file',
      ],
      relatedLinks: [],
      acceptFormats: Object.values(MIME_MAP),
      maxFileSize: 50 * 1024 * 1024,
    };
  });
}

function generatePlatformRoutes(): RouteConfig[] {
  return PLATFORM_ASSETS.map(p => {
    const pl = capitalize(p.platform);
    const al = assetLabel(p.asset);
    return {
      slug: `resize-${p.platform}-${p.asset}`,
      action: 'resize' as Action,
      platform: p.platform,
      asset: p.asset,
      dimensions: { width: p.width, height: p.height },
      tier: 4 as Tier,
      seo: {
        title: `Resize ${pl} ${al} (${p.width}×${p.height}) — Free Tool | LocalResizer`,
        description: `Free online tool to resize images for ${pl} ${al} to ${p.width}×${p.height}. Processed in your browser. No upload to servers.`,
        h1: `Resize ${pl} ${al} to ${p.width}×${p.height}`,
        subtitle: `Perfect ${pl} ${al} size, instantly. 100% free and private.`,
      },
      faq: platformFaq(p.platform, p.asset, p.width, p.height),
      howToSteps: [
        `Upload your image`,
        `Auto-resize to ${p.width}×${p.height} for ${pl} ${al}`,
        `Download your perfectly sized image`,
      ],
      relatedLinks: [],
      acceptFormats: Object.values(MIME_MAP),
      maxFileSize: p.maxFileSize || 50 * 1024 * 1024,
    };
  });
}

// PLACEHOLDER_EXPORTS

function buildRelatedLinks(routes: RouteConfig[]): void {
  const byFormat = new Map<string, RouteConfig[]>();
  const bySize = new Map<string, RouteConfig[]>();
  const byPlatform = new Map<string, RouteConfig[]>();

  for (const r of routes) {
    if (r.format) {
      const arr = byFormat.get(r.format) || [];
      arr.push(r);
      byFormat.set(r.format, arr);
    }
    if (r.targetSize) {
      const arr = bySize.get(r.targetSize) || [];
      arr.push(r);
      bySize.set(r.targetSize, arr);
    }
    if (r.platform) {
      const arr = byPlatform.get(r.platform) || [];
      arr.push(r);
      byPlatform.set(r.platform, arr);
    }
  }

  for (const r of routes) {
    const links = new Set<string>();
    if (r.format && byFormat.has(r.format)) {
      for (const other of byFormat.get(r.format)!) {
        if (other.slug !== r.slug) links.add(other.slug);
        if (links.size >= 4) break;
      }
    }
    if (r.targetSize && bySize.has(r.targetSize)) {
      for (const other of bySize.get(r.targetSize)!) {
        if (other.slug !== r.slug) links.add(other.slug);
        if (links.size >= 8) break;
      }
    }
    if (r.platform && byPlatform.has(r.platform)) {
      for (const other of byPlatform.get(r.platform)!) {
        if (other.slug !== r.slug) links.add(other.slug);
        if (links.size >= 12) break;
      }
    }
    r.relatedLinks = Array.from(links).slice(0, 12);
  }
}

const compressRoutes = generateCompressRoutes();
const resizeImageRoutes = generateResizeImageRoutes();
const platformRoutes = generatePlatformRoutes();

export const allRoutes: RouteConfig[] = [
  ...compressRoutes,
  ...resizeImageRoutes,
  ...platformRoutes,
];

buildRelatedLinks(allRoutes);

export function getRouteBySlug(slug: string): RouteConfig | undefined {
  return allRoutes.find(r => r.slug === slug);
}

// Phase 0 P0 slugs
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

export const phase0Routes = allRoutes.filter(r => PHASE0_SLUGS.includes(r.slug));
