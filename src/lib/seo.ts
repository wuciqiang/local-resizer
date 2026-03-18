import type { RouteConfig } from '../data/routes';

export function generateHowToSchema(route: RouteConfig): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: route.seo.h1,
    step: route.howToSteps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
    })),
  };
}

export function generateFAQSchema(route: RouteConfig): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: route.faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function generateCanonicalUrl(slug: string): string {
  return `https://localresizer.com/${slug}`;
}
