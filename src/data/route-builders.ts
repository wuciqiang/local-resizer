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
import { MAX_BATCH_BYTES, MAX_BATCH_FILES } from '../lib/image/limits';

function buildPhotoResizer20kbRoute(): RouteConfig {
  return {
    slug: 'photo-resizer-20kb',
    action: 'resize',
    intent: 'document-photo',
    targetSize: '20kb',
    targetSizeBytes: parseSize('20kb'),
    tier: 4,
    seo: {
      title: 'Photo Resizer 20KB Online - Private Browser Tool | LocalResizer',
      description: 'Resize a static photo toward a 20KB upload limit in your browser. No image upload, no signup, and best-effort local processing.',
      h1: 'Photo Resizer 20KB',
      subtitle: 'Resize a static photo toward 20KB locally with no server upload and no signup.',
    },
    faq: [
      {
        question: 'How do I resize a photo to 20KB on this page?',
        answer: 'Upload a static JPEG, PNG, or WebP photo, let the page reduce the image toward the 20KB target, and then download the result locally in your browser.',
      },
      {
        question: 'Can every photo become exactly 20KB?',
        answer: 'No. The current workflow is best-effort, which means the tool aims to get close to 20KB but cannot guarantee an exact result on every source image.',
      },
      {
        question: 'What happens if my photo is already under 20KB?',
        answer: 'The page keeps the original file when it is already within the requested size budget instead of forcing another round of compression.',
      },
      {
        question: 'Is this an official passport or exam photo validator?',
        answer: 'No. The page helps reduce a static image toward a 20KB limit, but it does not certify official upload rules, crop photos automatically, or validate government or exam requirements.',
      },
      {
        question: 'Are my photos uploaded anywhere?',
        answer: 'No. The current public tool processes static images locally in your browser with no server upload.',
      },
    ],
    howToSteps: [
      'Upload a static JPEG, PNG, or WebP photo',
      'Resize the photo toward the 20KB target locally',
      'Download the processed result',
    ],
    relatedLinks: [],
    acceptFormats: STATIC_IMAGE_ACCEPT_FORMATS,
    maxFileSize: 50 * 1024 * 1024,
  };
}

function buildCompressJpgFileRoute(): RouteConfig {
  return {
    slug: 'compress-jpg-file',
    action: 'compress',
    intent: 'generic-compress',
    format: 'jpeg',
    defaultTargetSizeBytes: parseSize('200kb'),
    tier: 4,
    seo: {
      title: 'Compress JPG File Online - Private JPG Compressor | LocalResizer',
      description: 'Compress a JPG file in your browser with no upload. Choose a target size and download a smaller JPEG locally.',
      h1: 'Compress JPG File Online',
      subtitle: 'Choose a target size and compress a JPG locally without uploading the image to a server.',
    },
    faq: [
      {
        question: 'Does this page work with JPG and JPEG files?',
        answer: 'Yes. The page accepts JPEG images, including files that use either the .jpg or .jpeg extension, and processes them locally in the browser.',
      },
      {
        question: 'Can I choose a custom target size for my JPG?',
        answer: 'Yes. This page opens in JPEG compression mode and lets you enter a target file size before processing.',
      },
      {
        question: 'Will the result stay JPEG?',
        answer: 'Yes. The current JPG page keeps JPEG output rather than converting the file to another format.',
      },
      {
        question: 'Can this tool guarantee an exact final file size?',
        answer: 'No. JPEG compression is best-effort here. The tool aims to get close to the requested target size, but the exact result still depends on the source image.',
      },
      {
        question: 'Are my JPG files uploaded?',
        answer: 'No. The current public tool processes static JPEG images locally in your browser with no server upload.',
      },
    ],
    howToSteps: [
      'Upload a JPG or JPEG image',
      'Choose the target size you want for the smaller JPEG',
      'Process and download the result locally',
    ],
    relatedLinks: [],
    acceptFormats: [MIME_MAP.jpeg],
    maxFileSize: 50 * 1024 * 1024,
    lockedAction: 'compress',
    hideActionTabs: true,
  };
}

function buildCompressImageToSizeRoute(size: string): RouteConfig {
  const sizeLabel = formatSizeLabel(size);
  const seo = {
    title: `Compress Image to ${sizeLabel} Online - Private Browser Tool | LocalResizer`,
    description: `Compress static JPEG, PNG, or WebP images toward ${sizeLabel} in your browser. No upload, no signup, and best-effort local processing.`,
    h1: `Compress Image to ${sizeLabel}`,
    subtitle: `Target a ${sizeLabel} image file-size budget locally while keeping processing in your browser.`,
  };

  if (size === '500kb') {
    seo.title = 'Compress Image to 500KB Online Free - No Upload | LocalResizer';
    seo.description = 'Compress or convert an image to 500KB in your browser. Works with JPEG, PNG, and WebP files locally with no upload or signup.';
    seo.subtitle = 'Reduce an image toward a 500KB upload limit locally, without sending the file to a server.';
  }

  return {
    slug: `compress-image-to-${size}`,
    action: 'compress',
    intent: 'generic-compress',
    targetSize: size,
    targetSizeBytes: parseSize(size),
    tier: 4,
    seo,
    faq: [
      {
        question: `Which image formats can I compress toward ${sizeLabel}?`,
        answer: 'This page accepts static JPEG, PNG, and WebP images. Animated GIF, PDF, video, and document compression are outside the current public workflow.',
      },
      {
        question: `Can every image become exactly ${sizeLabel}?`,
        answer: `No. The page uses a best-effort workflow, so it aims to get close to ${sizeLabel} but cannot guarantee an exact byte-for-byte final size on every source image.`,
      },
      {
        question: `What happens if my image is already under ${sizeLabel}?`,
        answer: 'The original file is kept when it is already within the requested size budget instead of forcing another round of compression.',
      },
      {
        question: 'How are PNG files handled on this page?',
        answer: 'PNG files can keep PNG output, but because PNG does not use a JPEG-style quality slider, the page may ask for or apply a PNG-specific reduction strategy when a much smaller file is needed.',
      },
      {
        question: 'Are my images uploaded anywhere?',
        answer: 'No. The current public workflow processes static images locally in your browser with no server upload.',
      },
    ],
    howToSteps: [
      'Upload a static JPEG, PNG, or WebP image',
      `Compress the image toward the ${sizeLabel} target locally`,
      'Download the processed result',
    ],
    relatedLinks: [],
    acceptFormats: STATIC_IMAGE_ACCEPT_FORMATS,
    maxFileSize: 50 * 1024 * 1024,
  };
}

function buildResizePngRoute(): RouteConfig {
  return {
    slug: 'resize-png',
    action: 'resize',
    intent: 'format-resize',
    format: 'png',
    defaultDimensions: { width: 1280, height: 720 },
    tier: 4,
    seo: {
      title: 'Resize PNG Online Free - PNG Resizer | LocalResizer',
      description: 'Resize PNG images online free by width and height. Keep PNG output and transparency with private in-browser processing, no upload or signup.',
      h1: 'Resize PNG Online',
      subtitle: 'Resize a PNG by pixel dimensions locally and download a new PNG without server upload.',
    },
    faq: [
      {
        question: 'Does this page only accept PNG images?',
        answer: 'Yes. This page is focused on PNG resizing and currently accepts static PNG files only.',
      },
      {
        question: 'Can I enter custom width and height values?',
        answer: 'Yes. The page opens in resize mode and lets you enter the pixel dimensions you want before processing.',
      },
      {
        question: 'Will the output stay PNG?',
        answer: 'Yes. The current resize-png page keeps PNG output.',
      },
      {
        question: 'Does resizing a PNG preserve transparency?',
        answer: 'Yes. The current PNG resize path keeps PNG output, and transparent padding remains transparent when the page exports a PNG canvas.',
      },
      {
        question: 'Does this page work with PDF, SVG, or GIF files?',
        answer: 'No. The current public workflow is limited to static image files, and this page is specifically limited to PNG.',
      },
    ],
    howToSteps: [
      'Upload a static PNG image',
      'Enter the pixel dimensions you want for the new PNG',
      'Resize and download the PNG locally',
    ],
    relatedLinks: [],
    acceptFormats: [MIME_MAP.png],
    maxFileSize: 50 * 1024 * 1024,
    lockedAction: 'resize',
    hideActionTabs: true,
    resizeMode: 'contain',
    forceCanvasSize: false,
  };
}

function buildBatchResizeRoute(): RouteConfig {
  return {
    slug: 'batch-resize-images',
    action: 'resize',
    intent: 'batch-resize',
    defaultDimensions: { width: 1280, height: 720 },
    tier: 4,
    seo: {
      title: 'Batch Resize Images Online - Resize Multiple Images | LocalResizer',
      description: 'Batch resize up to 20 JPEG, PNG, or WebP images in your browser. Apply one size, keep aspect ratios, and download the results as a ZIP.',
      h1: 'Batch Resize Images Online',
      subtitle: 'Resize multiple static images to one shared size locally, then download every result in one ZIP.',
    },
    faq: [
      {
        question: 'How do I batch resize images on this page?',
        answer: 'Select up to 20 static images, enter one width and height, process the files sequentially in your browser, and download the results individually or in one ZIP.',
      },
      {
        question: 'How many images can I resize at once?',
        answer: 'The current page accepts up to 20 files with a 100MB total input limit. Individual files can be up to 50MB. Source images, each output canvas, and the combined output pixels and retained result bytes also have browser-safety limits.',
      },
      {
        question: 'Will every image keep its original aspect ratio?',
        answer: 'Yes. The batch page fits each source image within the width and height you enter without stretching it. Outputs can have different final dimensions when source aspect ratios differ.',
      },
      {
        question: 'Does batch resize change JPG, PNG, or WebP formats?',
        answer: 'No. The current batch resize workflow keeps each file in its original supported format. Format conversion is not part of this page.',
      },
      {
        question: 'Are batch images uploaded to a server?',
        answer: 'No. The current workflow processes static JPEG, PNG, and WebP files locally in your browser with no image-content upload to our server.',
      },
    ],
    howToSteps: [
      'Select up to 20 static JPEG, PNG, or WebP images',
      'Enter one output width and height for the batch',
      'Resize the files and download the results as a ZIP',
    ],
    relatedLinks: [],
    acceptFormats: STATIC_IMAGE_ACCEPT_FORMATS,
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: MAX_BATCH_FILES,
    maxBatchSize: MAX_BATCH_BYTES,
    lockedAction: 'resize',
    hideActionTabs: true,
    resizeMode: 'fit',
    forceCanvasSize: false,
  };
}

function buildFormatConversionRoutes(): RouteConfig[] {
  const maxFileSize = 50 * 1024 * 1024;

  return [
    {
      slug: 'webp-to-jpg',
      action: 'convert',
      intent: 'format-convert',
      tier: 4,
      seo: {
        title: 'WebP to JPG Converter Online - No Upload | LocalResizer',
        description: 'Convert a static WebP image to JPG in your browser. Choose quality and a background color for transparent areas, then download locally with no image upload.',
        h1: 'Convert WebP to JPG',
        subtitle: 'Re-encode a static WebP image as a JPG in your browser, with control over quality and the background color used for transparent areas.',
      },
      faq: [
        {
          question: 'Does JPG keep transparency?',
          answer: 'No. The JPG format has no alpha channel, so transparent pixels in a WebP are filled with the background color you choose before conversion. The default background is white.',
        },
        {
          question: 'What does the quality setting do?',
          answer: 'It sets the JPEG encoding quality from 1 to 100, with 92 as the default. Higher values keep more detail and produce a larger file. It is a quality tradeoff, not an exact file-size target.',
        },
        {
          question: 'Are my images uploaded to a server?',
          answer: 'No. Conversion runs locally in your browser with the Canvas API. The image content is never sent over the network, and exporting through Canvas typically removes EXIF and GPS metadata.',
        },
        {
          question: 'Which files does this page accept, and are JPG and JPEG the same?',
          answer: 'This page accepts one static WebP image at a time. JPG and JPEG are two names for the same image format; the converter creates JPEG image data with a .jpg filename. Animated WebP, HEIC, SVG, GIF, and PDF are not supported.',
        },
        {
          question: 'Will the JPG keep the same dimensions and always be smaller?',
          answer: 'The output keeps the original pixel width and height, but it is not guaranteed to use fewer bytes. WebP is often more compression-efficient than JPEG, so the result can be larger even though the dimensions stay the same.',
        },
      ],
      howToSteps: [
        'Drop one static WebP image into the tool or click to browse your files.',
        'Adjust the JPEG quality and pick a background color for any transparent areas.',
        'Convert and download the JPG. The image never leaves your browser.',
      ],
      relatedLinks: [],
      acceptFormats: [MIME_MAP.webp],
      maxFileSize,
    },
    {
      slug: 'photo-to-png',
      action: 'convert',
      intent: 'format-convert',
      tier: 4,
      seo: {
        title: 'Photo to PNG Converter Online - No Upload | LocalResizer',
        description: 'Convert a static JPG or WebP photo to PNG in your browser. Keep the original pixel dimensions and download locally with no image upload or signup.',
        h1: 'Convert Photo to PNG',
        subtitle: 'Re-encode a static JPG or WebP photo as a PNG in your browser. The original pixel dimensions are kept and nothing is uploaded.',
      },
      faq: [
        {
          question: 'Are JPG and JPEG both supported?',
          answer: 'Yes. JPG and JPEG are the same format, and this page also accepts static WebP. If your file is already a PNG, use the resize PNG page instead. HEIC, SVG, GIF, and PDF are not supported.',
        },
        {
          question: 'Does the PNG keep the original dimensions?',
          answer: 'Yes. Conversion only re-encodes the format. The output PNG keeps the exact pixel width and height of the source image.',
        },
        {
          question: 'Will the PNG be smaller than the original?',
          answer: 'Usually not. PNG uses lossless compression, so a photo converted from JPG to PNG is often larger than the source. Use a compress page if file size is the real goal.',
        },
        {
          question: 'Does converting a JPG to PNG restore transparency or quality?',
          answer: 'No. A JPG has no alpha channel and its compression already discarded detail. Converting to PNG cannot bring back transparency or sharpness the source never had. Transparency already present in a WebP is kept in the PNG.',
        },
        {
          question: 'Are my photos uploaded to a server?',
          answer: 'No. Conversion runs locally in your browser with the Canvas API. The image content is never sent over the network, and exporting through Canvas typically removes EXIF and GPS metadata.',
        },
      ],
      howToSteps: [
        'Drop one static JPG or WebP image into the tool or click to browse your files.',
        'Confirm the locked PNG output. Pixel dimensions stay exactly as they are.',
        'Convert and download the PNG. The image never leaves your browser.',
      ],
      relatedLinks: [],
      acceptFormats: [MIME_MAP.jpeg, MIME_MAP.webp],
      maxFileSize,
    },
  ];
}

function buildExplicitRoutes(): RouteConfig[] {
  const signatureRoute: RouteConfig = {
    slug: 'signature-resizer',
    action: 'resize',
    intent: 'signature',
    format: 'png',
    defaultTargetSizeBytes: parseSize('50kb'),
    defaultDimensions: { width: 800, height: 300 },
    tier: 4,
    seo: {
      title: 'Signature Resizer Online - Resize Signature Image Privately | LocalResizer',
      description: 'Resize and compress a signature image locally in your browser. Trim extra whitespace, choose transparent PNG or white-background JPG, and download the result privately.',
      h1: 'Signature Resizer Online',
      subtitle: 'Trim extra whitespace, resize the signature image, and export a lighter result locally in your browser.',
    },
    faq: [
      {
        question: 'Does this page automatically remove extra whitespace around a signature?',
        answer: 'Yes. The signature workflow can trim empty white or transparent margins before export so the final image stays tighter around the signature itself.',
      },
      {
        question: 'Can I keep the signature on a transparent background?',
        answer: 'Yes. The page supports transparent PNG output, and it can also export a white-background JPG if that better matches the upload form you need to use.',
      },
      {
        question: 'Can I control both dimensions and file size?',
        answer: 'Yes. This workflow lets you set target dimensions and apply an optional target-size budget so the result is easier to fit into common upload rules.',
      },
      {
        question: 'Does this page generate or verify an official signature format?',
        answer: 'No. The tool resizes and trims an existing signature image locally, but it does not generate signatures or certify compliance with any government, exam, or portal-specific rules.',
      },
      {
        question: 'Are signature images uploaded anywhere?',
        answer: 'No. The current signature workflow processes the image locally in your browser with no server upload.',
      },
    ],
    howToSteps: [
      'Upload a static signature image',
      'Trim extra whitespace and choose the output settings you want',
      'Export and download the processed signature locally',
    ],
    relatedLinks: [],
    acceptFormats: STATIC_IMAGE_ACCEPT_FORMATS,
    maxFileSize: 50 * 1024 * 1024,
    lockedAction: 'resize',
    hideActionTabs: true,
  };

  const splitterRoute: RouteConfig = {
    slug: 'image-splitter',
    action: 'split',
    intent: 'image-splitter',
    tier: 4,
    seo: {
      title: 'Image Splitter Online - Split Image into Grid Pieces | LocalResizer',
      description: 'Split a static image into rows and columns in your browser. Preview the pieces and download each result locally.',
      h1: 'Image Splitter Online',
      subtitle: 'Split a static image into grid pieces locally and download each exported tile without server upload.',
    },
    faq: [
      {
        question: 'What does this image splitter do?',
        answer: 'It cuts one static image into a grid of rows and columns, then lets you download each resulting tile locally in your browser.',
      },
      {
        question: 'What grid size does the page support?',
        answer: 'You can choose the number of rows and columns for the split. The first version starts with a simple grid workflow rather than freeform slicing.',
      },
      {
        question: 'Can I split PNG, JPG, and WebP files?',
        answer: 'Yes. The current image splitter works with static JPEG, PNG, and WebP files.',
      },
      {
        question: 'Does this page split PDF pages, GIF frames, or video?',
        answer: 'No. The current public workflow is limited to static images only and does not include PDF, GIF-frame, or video splitting.',
      },
      {
        question: 'Are my images uploaded for splitting?',
        answer: 'No. The image is split locally in your browser with no server upload.',
      },
    ],
    howToSteps: [
      'Upload one static image',
      'Choose the rows and columns for the grid split',
      'Download the generated image pieces locally',
    ],
    relatedLinks: [],
    acceptFormats: STATIC_IMAGE_ACCEPT_FORMATS,
    maxFileSize: 50 * 1024 * 1024,
  };

  const targetCompressRoutes = ['20kb', '50kb', '100kb', '200kb', '500kb', '1mb', '2mb']
    .map(buildCompressImageToSizeRoute);

  return [
    ...targetCompressRoutes,
    buildPhotoResizer20kbRoute(),
    buildCompressJpgFileRoute(),
    buildResizePngRoute(),
    buildBatchResizeRoute(),
    signatureRoute,
    splitterRoute,
    ...buildFormatConversionRoutes(),
  ].filter((route) => ACTIVE_SLUGS.has(route.slug));
}

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
  const byIntent = new Map<string, RouteConfig[]>();
  const sizeNeighborLinks = new Map<string, string[]>();
  for (const prefix of [
    'resize-image-to-',
    'compress-image-to-',
    'compress-jpeg-to-',
    'compress-png-to-',
  ]) {
    const familyRoutes = routes
      .filter((route) => route.slug.startsWith(prefix) && route.targetSizeBytes)
      .sort((first, second) => first.targetSizeBytes! - second.targetSizeBytes!);

    familyRoutes.forEach((route, index) => {
      sizeNeighborLinks.set(route.slug, [
        familyRoutes[index - 1]?.slug,
        familyRoutes[index + 1]?.slug,
      ].filter((slug): slug is string => Boolean(slug)));
    });
  }

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

    if (route.intent) {
      const items = byIntent.get(route.intent) ?? [];
      items.push(route);
      byIntent.set(route.intent, items);
    }
  }

  for (const route of routes) {
    const links = new Set<string>();

    if (route.intent) {
      for (const other of byIntent.get(route.intent) ?? []) {
        if (other.slug !== route.slug) {
          links.add(other.slug);
        }
        if (links.size >= 4) {
          break;
        }
      }
    }

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

    if (route.slug === 'compress-jpg-file') {
      links.add('compress-jpeg-to-50kb');
      links.add('compress-jpeg-to-200kb');
      links.add('photo-resizer-20kb');
      links.add('webp-to-jpg');
    }

    for (const neighbor of sizeNeighborLinks.get(route.slug) ?? []) {
      links.add(neighbor);
    }

    if (route.slug === 'resize-png') {
      links.add('image-splitter');
      links.add('batch-resize-images');
      links.add('photo-to-png');
    }

    if (route.slug === 'image-splitter') {
      links.add('resize-png');
      links.add('batch-resize-images');
    }

    if (route.slug === 'batch-resize-images') {
      links.add('resize-png');
      links.add('resize-image-to-100kb');
      links.add('compress-image-to-100kb');
      links.add('image-splitter');
    }

    if (route.slug === 'webp-to-jpg') {
      links.add('photo-to-png');
      links.add('compress-jpg-file');
      links.add('resize-png');
    }

    if (route.slug === 'photo-to-png') {
      links.add('webp-to-jpg');
      links.add('resize-png');
      links.add('compress-image-to-500kb');
    }

    if (route.slug === 'resize-image-to-100kb') {
      links.add('batch-resize-images');
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
      const seo = {
        title: `Resize Image to ${sizeLabel} Online Free - Browser Tool | LocalResizer`,
        description: `Resize any image to ${sizeLabel} in your browser. Supports JPEG, PNG, WebP. No upload required. Privacy-first local processing with no server upload.`,
        h1: `Resize Image to ${sizeLabel}`,
        subtitle: `Target a ${sizeLabel} file-size budget locally while keeping the image usable.`,
      };

      if (size === '20kb') {
        seo.title = 'Resize Image to 20KB Online Free - No Upload | LocalResizer';
        seo.description = 'Resize image to 20KB online in your browser. Reduce JPEG, PNG, or WebP files locally with no upload, signup, or watermark.';
        seo.subtitle = 'Shrink an image toward a 20KB upload limit locally while keeping the aspect ratio intact.';
      }

      routes.push({
        slug,
        action: 'resize',
        targetSize: size,
        targetSizeBytes: parseSize(size),
        tier: 4,
        seo,
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
          description: `Create an exact ${asset.width}x${asset.height} ${platformName} ${assetName} canvas in your browser. No upload, no signup. Privacy-first resizer for social media assets.`,
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
        resizeMode: 'contain',
        forceCanvasSize: true,
      });
    }
  }

  routes.push(...buildExplicitRoutes());

  return routes;
}
