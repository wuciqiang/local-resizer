import type { RouteConfig } from '../data/routes';
import type { BreadcrumbItem } from './site-structure';
import { formatPageUrl } from './urls';

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
      item: formatPageUrl(item.href),
    })),
  };
}

export function generateCanonicalUrl(slug: string): string {
  return formatPageUrl(slug);
}

export function generateWebSiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LocalResizer',
    url: 'https://localresizer.com/',
  };
}

export function generateOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LocalResizer',
    url: 'https://localresizer.com/',
    logo: 'https://localresizer.com/logo-social.png',
  };
}

export function generateWebApplicationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LocalResizer',
    url: 'https://localresizer.com/',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}
