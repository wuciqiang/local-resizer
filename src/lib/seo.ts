import type { KeywordRoute } from '../data/routes';
import type { PageCopy } from './content';

export const buildCanonicalUrl = (slug: string) => `https://picresizermatrix.com/${slug}`;

export const buildHowToSchema = (page: KeywordRoute, copy: PageCopy) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: copy.howToTitle,
  description: page.description,
  step: copy.howToSteps.map((text, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: `Step ${index + 1}`,
    text
  }))
});

export const buildFaqSchema = (_page: KeywordRoute, copy: PageCopy) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: copy.faq.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
});
