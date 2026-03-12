import type { RouteConfig } from '../data/routes';
import { formatSizeLabel } from '../data/routes';

export function generateIntroText(route: RouteConfig): string {
  if (route.platform && route.asset && route.dimensions) {
    const pl = capitalize(route.platform);
    const al = route.asset.split('-').map(capitalize).join(' ');
    return `Resize your image to the perfect ${pl} ${al} dimensions (${route.dimensions.width}×${route.dimensions.height} pixels). Our free tool processes everything in your browser — your files never leave your device.`;
  }
  if (route.action === 'compress' && route.format && route.targetSize) {
    const fl = route.format.toUpperCase();
    const sl = formatSizeLabel(route.targetSize);
    return `Compress your ${fl} image to exactly ${sl} with our free online tool. Using smart binary-search compression, we find the optimal quality setting to hit your target size with minimal quality loss. 100% browser-based — nothing is uploaded.`;
  }
  if (route.targetSize) {
    const sl = formatSizeLabel(route.targetSize);
    return `Resize any image to ${sl} instantly. Our tool intelligently scales dimensions and optimizes quality to reach your target file size. Works with JPEG, PNG, WebP, and GIF — all processed locally in your browser.`;
  }
  return 'Process your images instantly, right in your browser. No uploads, no servers, no privacy concerns.';
}

export function generateFormatInfo(format: string): string {
  const info: Record<string, string> = {
    jpeg: 'JPEG is the most widely used image format, ideal for photographs and complex images. It uses lossy compression, meaning file size can be reduced significantly by adjusting quality. JPEG does not support transparency.',
    png: 'PNG uses lossless compression, preserving every pixel perfectly. It supports transparency (alpha channel), making it ideal for logos, icons, and graphics. PNG files are typically larger than JPEG for photographs.',
    webp: 'WebP is a modern format developed by Google that provides superior compression for both lossy and lossless images. It supports transparency and animation, often achieving 25-35% smaller files than JPEG/PNG at equivalent quality.',
    gif: 'GIF supports animation and transparency with a palette of up to 256 colors. It\'s widely used for short animations, memes, and simple graphics. For photographic content, JPEG or WebP are better choices.',
  };
  return info[format] || '';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
