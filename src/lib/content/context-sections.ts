import type { RouteConfig } from '../../data/routes';
import { assetLabel, formatSizeLabel, platformLabel } from '../../data/routes';
import type { PageContextSection } from './types';

function resizeComparisonText(size: string): string {
  if (size === '20kb') {
    return 'If this limit is too aggressive for your image, try the 100KB page first. If you only need an exact YouTube canvas instead of a file-size target, use one of the live YouTube size pages instead.';
  }

  if (size === '100kb') {
    return 'If you are failing a hard form submission, move down to the 20KB page. If you are preserving visual quality for a looser upload limit, move up to the 2MB page before trying a stronger reduction.';
  }

  return 'If this budget is still too large for the final destination, compare the 100KB or 20KB pages. If the destination cares about fixed dimensions more than file size, switch to one of the exact YouTube canvas pages instead.';
}

export function generateContextSections(route: RouteConfig): PageContextSection[] {
  if (route.platform && route.asset && route.dimensions) {
    const platformName = platformLabel(route.platform);
    const assetName = assetLabel(route.asset);
    const sizeLabel = `${route.dimensions.width} x ${route.dimensions.height}`;

    return [
      {
        title: 'Common real-world use cases',
        body: `Use this ${platformName} ${assetName} page when you already know the destination needs an exact ${sizeLabel} canvas. It is a good fit for creators refreshing channel art, marketers preparing campaign thumbnails, and designers who need a predictable export size before handing the file to another tool or stakeholder.`,
      },
      {
        title: 'What changes the final look',
        body: `The exported file always uses the exact ${sizeLabel} canvas, but the visual result still depends on your source image. Wide images usually fit more naturally on banner-style canvases, while tall or square sources can produce visible padding. The current release keeps the whole image visible instead of cropping automatically, so composition still matters before export.`,
      },
      {
        title: 'When to choose a different live page',
        body: route.asset === 'banner'
          ? 'Choose the thumbnail page when the destination is the smaller video-cover format instead of wide channel art. If the real constraint is upload size rather than a fixed canvas, move to the resize-by-size pages and target a file-size budget first.'
          : 'Choose the banner page when you need wide channel art instead of a compact video-cover image. If the real problem is file-size compliance rather than canvas dimensions, compare the live resize-by-size pages instead of forcing everything through a thumbnail canvas.',
      },
    ];
  }

  if (route.action === 'compress' && route.format && route.targetSize) {
    const sizeLabel = formatSizeLabel(route.targetSize);

    if (route.format === 'png') {
      return [
        {
          title: 'Common real-world use cases',
          body: `This page is most useful when a screenshot, logo, UI mockup, or transparent graphic has to stay PNG while moving toward ${sizeLabel}. It is a better fit than a JPEG page when preserving crisp edges or transparency matters more than reaching the target by any means necessary.`,
        },
        {
          title: 'What changes the final result',
          body: `Flat-color graphics compress more easily than dense screenshots with lots of text, gradients, or shadows. Because PNG does not use the same lossy quality slider as JPEG, the tool may reduce pixel dimensions when that is the most reliable path to a smaller file. The closer your source already is to the target, the less visible that change tends to be.`,
        },
        {
          title: 'When to choose a different live page',
          body: 'If the image is really a photo and format loyalty is not important, the JPEG compression pages can usually shrink it more aggressively. If the destination only cares about being smaller overall, compare the live resize-by-size pages instead of insisting on a PNG-specific workflow.',
        },
      ];
    }

    return [
      {
        title: 'Common real-world use cases',
        body: route.targetSize === '50kb'
          ? `A ${sizeLabel} JPEG page fits strict upload gates: government forms, exam registration systems, lightweight profile photos, and email-friendly attachments. People usually land here because the limit is non-negotiable and they need the smallest workable JPEG without manually guessing quality settings.`
          : `A ${sizeLabel} JPEG page fits CMS uploads, blog feature images, marketplace listings, and other workflows where the file should stay light without looking overly damaged. It is the more forgiving live JPEG option when 50KB would be too aggressive for the visual quality you want to keep.`,
      },
      {
        title: 'What changes the final result',
        body: `Busy photos with fine detail, noise, or text overlays usually need more aggressive compression than simple product shots or cleaner portraits. The tool keeps the original file when it is already under ${sizeLabel}, but once compression starts, the exact result still depends on how much detail the original image contains and how hard the target pushes against it.`,
      },
      {
        title: 'When to choose a different live page',
        body: route.targetSize === '50kb'
          ? 'If the result is too harsh, move up to the 200KB page first. If the file does not have to stay JPEG and the real requirement is only “smaller overall,” compare the resize-by-size pages for a more flexible reduction path.'
          : 'If the upload gate is much stricter, move down to the 50KB page. If the image must stay PNG because of transparency or screenshot fidelity, switch to the live PNG page instead of forcing a JPEG workflow.',
      },
    ];
  }

  if (route.targetSize) {
    const sizeLabel = formatSizeLabel(route.targetSize);

    return [
      {
        title: 'Common real-world use cases',
        body: route.targetSize === '20kb'
          ? `The ${sizeLabel} page is for strict upload limits: forms, identity portals, small avatars, or any workflow where the platform simply rejects larger files. Users usually choose this page when they care more about compliance than maximum fidelity.`
          : route.targetSize === '100kb'
            ? `The ${sizeLabel} page is the balanced middle ground for web publishing, CMS uploads, article thumbnails, and moderately strict submission systems. It is often the first page to try when you need something leaner than the original file without squeezing the image as hard as a tiny compliance limit would require.`
            : `The ${sizeLabel} page is the roomy option for marketplaces, documentation portals, listing uploads, and other destinations that allow a larger image but still benefit from a controlled reduction. It is useful when quality matters, but the original file is still unnecessarily heavy.`,
      },
      {
        title: 'What changes the final result',
        body: `The final size depends on the image itself. Clean graphics and already-optimized photos usually land near ${sizeLabel} more easily than noisy photos or giant screenshots. JPEG and WebP can use quality adjustments in addition to dimension scaling, while PNG relies more heavily on dimensions, so different file types can behave differently even on the same page.`,
      },
      {
        title: 'When to choose a different live page',
        body: resizeComparisonText(route.targetSize),
      },
    ];
  }

  return [
    {
      title: 'Common real-world use cases',
      body: 'Use the current tool set for static-image workflows that fit the live public release.',
    },
    {
      title: 'What changes the final result',
      body: 'Different file formats and image complexity levels produce different compression and resize outcomes.',
    },
    {
      title: 'When to choose a different live page',
      body: 'Compare the guide pages and related tools when the first page you land on does not match your real constraint.',
    },
  ];
}
