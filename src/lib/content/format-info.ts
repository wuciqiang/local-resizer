import type { Format } from '../../data/routes';

export function generateFormatInfo(format: Format): string {
  const info: Record<Format, string> = {
    jpeg: 'JPEG is the most common format for photos and complex images. It uses lossy compression, which makes it a strong choice when you need a smaller file and can accept some controlled quality loss. JPEG excels at compressing photographs and images with gradients, achieving file sizes 50-80% smaller than PNG for the same visual quality. However, JPEG does not support transparency and can introduce compression artifacts in images with sharp edges or text. Best for: product photos, blog images, portraits, and any photographic content where file size matters more than pixel-perfect accuracy.',
    png: 'PNG is a lossless format with transparency support. It is a good fit for interface graphics, logos, and screenshots, but it often needs larger files than JPEG for photo-heavy images. PNG preserves every pixel exactly as it was, making it ideal for graphics that will be edited multiple times or require transparency layers. The format uses DEFLATE compression, which works best on images with large areas of solid color. PNG-8 supports 256 colors with smaller file sizes, while PNG-24 supports millions of colors. Best for: logos, icons, interface elements, screenshots, and any image requiring transparency or lossless quality.',
    webp: 'WebP is a modern format that can produce smaller files than JPEG or PNG for many static images. It supports both lossy and lossless compression, plus transparency. Developed by Google, WebP typically achieves 25-35% smaller file sizes than JPEG at equivalent quality levels, and 26% smaller than PNG for lossless images. WebP uses advanced compression techniques including predictive coding and variable block sizes. Browser support is now excellent (95%+ globally), making it a strong choice for modern web development. Best for: web optimization, responsive images, e-commerce product photos, and any scenario where you need the smallest possible file size with good quality.',
  };

  return info[format];
}
