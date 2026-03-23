import type { RouteConfig } from '../data/routes';
import type { BreadcrumbItem } from './site-structure';

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

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: new URL(item.href, 'https://localresizer.com').href,
    })),
  };
}

export function generateCanonicalUrl(slug: string): string {
  return `https://localresizer.com/${slug}`;
}
