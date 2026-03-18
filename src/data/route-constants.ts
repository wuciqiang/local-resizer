import type { Format } from './route-types';

export const FORMATS: Format[] = ['jpeg', 'png', 'webp'];

export const SIZE_TIERS_KB = [
  10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250, 300,
  350, 400, 450, 500, 600, 700, 800, 900, 1000, 1500, 2000,
];

export const SIZE_TIERS_MB = [1, 2, 3, 4, 5, 8, 10];

export const RESIZE_IMAGE_SIZES = [
  '20kb', '30kb', '50kb', '80kb', '100kb', '150kb', '200kb', '250kb', '300kb', '400kb',
  '500kb', '600kb', '800kb', '1mb', '1.5mb', '2mb', '3mb', '5mb', '8mb', '10mb',
];

export interface PlatformAsset {
  platform: string;
  asset: string;
  width: number;
  height: number;
  maxFileSize?: number;
}

export const PLATFORM_ASSETS: PlatformAsset[] = [
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

export const MIME_MAP: Record<Format, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const STATIC_IMAGE_ACCEPT_FORMATS = Object.values(MIME_MAP);

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

export const ACTIVE_SLUGS = new Set(PHASE0_SLUGS);
