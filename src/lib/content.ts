import type { KeywordRoute } from '../data/routes';

type TemplateModel = {
  format: string;
  formatLower: string;
  size: string;
};

const interpolate = (template: string, model: TemplateModel) =>
  template
    .replaceAll('{format}', model.format)
    .replaceAll('{size}', model.size)
    .replaceAll('{formatLower}', model.formatLower);

export type PageCopy = {
  subtitle: string;
  whyTitle: string;
  whyBullets: Array<{ title: string; body: string }>;
  howToTitle: string;
  howToSteps: string[];
  faq: Array<{ question: string; answer: string }>;
  ctaTitle: string;
  ctaBody: string;
};

export const buildPageCopy = (route: KeywordRoute): PageCopy => {
  const model: TemplateModel = {
    format: route.formatLabel,
    formatLower: route.formatLabel.toLowerCase(),
    size: route.sizeLabel
  };

  return {
    subtitle: interpolate(
      'Resize your {formatLower} images to exactly {size} in seconds. 100% browser-based processing - your files never leave your device.',
      model
    ),
    whyTitle: interpolate('Why Use Our {format} to {size} Compressor?', model),
    whyBullets: [
      {
        title: 'No Uploads Required',
        body: interpolate(
          'All compression happens directly in your browser. Your images never touch our servers - complete privacy guaranteed.',
          model
        )
      },
      {
        title: 'Exact File Size Control',
        body: interpolate(
          'Need exactly {size}? Our smart algorithm automatically adjusts quality to hit your target size precisely, not approximately.',
          model
        )
      },
      {
        title: 'Free & Unlimited',
        body: interpolate(
          'No file limits, no watermarks, no sign-ups. Compress as many {formatLower} files as you need, completely free.',
          model
        )
      }
    ],
    howToTitle: interpolate('How to Compress {format} to {size} in 3 Steps', model),
    howToSteps: [
      interpolate('Select your {formatLower} file by clicking Choose File or using drag and drop.', model),
      interpolate('Set the target size to {size}. The tool automatically aims for that file size.', model),
      interpolate('Download your compressed {formatLower} image after the browser finishes processing.', model)
    ],
    faq: [
      {
        question: 'Is my image really safe? Does it upload anywhere?',
        answer: interpolate(
          'Yes. This tool runs fully in your browser using JavaScript. Your {formatLower} file never leaves your device, and the page can keep working even after it is loaded.',
          model
        )
      },
      {
        question: 'Why do I need to compress images to a specific KB size?',
        answer: interpolate(
          'Many platforms set hard upload limits. This page helps you get your image close to {size} for forms, applications, social uploads, or email attachments without trial and error.',
          model
        )
      },
      {
        question: 'How much quality will I lose? How does the algorithm work?',
        answer: interpolate(
          'The compressor uses binary search to find an output close to {size} while preserving as much visual quality as possible. Lower targets usually require stronger compression.',
          model
        )
      },
      {
        question: 'Are there any limits on file count or size?',
        answer: interpolate(
          'No account, quota, or watermark is required. Since the work happens in the browser, you can compress multiple files freely, though very large files may take longer.',
          model
        )
      }
    ],
    ctaTitle: interpolate('Start Compressing Your {format} Files Now', model),
    ctaBody: interpolate('Fast, secure, and free. Get your {formatLower} images to exactly {size} in seconds.', model)
  };
};
