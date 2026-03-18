import type { RouteConfig } from '../../data/routes';
import {
  assetLabel,
  formatLabel,
  formatSizeLabel,
  platformLabel,
} from '../../data/routes';
import type { PageHighlight } from './types';

export function generatePageHighlights(route: RouteConfig): PageHighlight[] {
  if (route.platform && route.asset && route.dimensions) {
    const platformName = platformLabel(route.platform);
    const assetName = assetLabel(route.asset);
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
