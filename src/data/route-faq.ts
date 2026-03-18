import type { FaqItem, Format } from './route-types';
import { assetLabel, formatLabel, formatSizeLabel, platformLabel } from './route-formatters';

export function compressFaq(format: Format, size: string): FaqItem[] {
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

export function resizeImageFaq(size: string): FaqItem[] {
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

export function platformFaq(platform: string, asset: string, width: number, height: number): FaqItem[] {
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
