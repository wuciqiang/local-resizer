import type { RouteConfig } from '../data/routes';
import { formatPagePath } from './urls';

export interface BreadcrumbItem {
  href: string;
  label: string;
}

export interface GuideLink extends BreadcrumbItem {
  description: string;
}

export type HubSlug =
  | 'compress-image'
  | 'resize-image'
  | 'youtube-image-sizes'
  | 'signature-tools'
  | 'image-tools';

export interface HubInfo {
  slug: HubSlug;
  href: string;
  label: string;
  title: string;
  description: string;
}

const HUBS: Record<HubSlug, HubInfo> = {
  'compress-image': {
    slug: 'compress-image',
    href: formatPagePath('compress-image'),
    label: 'Compress Image Guide',
    title: 'Compress image guides for current live workflows',
    description: 'Understand the current JPEG and PNG compression pages, the difference between target-size budgets, and how to choose the right page before you process a file.',
  },
  'resize-image': {
    slug: 'resize-image',
    href: formatPagePath('resize-image'),
    label: 'Resize Image Guide',
    title: 'Resize image guides for dimensions, batches, and target sizes',
    description: 'Compare one-file dimensions, batch resizing, PNG-specific controls, and the current target-size pages before you process an image.',
  },
  'youtube-image-sizes': {
    slug: 'youtube-image-sizes',
    href: formatPagePath('youtube-image-sizes'),
    label: 'YouTube Image Size Guide',
    title: 'YouTube image size guides for current live pages',
    description: 'Review the live YouTube banner and thumbnail pages, the exact canvas sizes they export, and what to expect when your source ratio does not match.',
  },
  'signature-tools': {
    slug: 'signature-tools',
    href: formatPagePath('signature-tools'),
    label: 'Signature Tools Guide',
    title: 'Signature image tools for current live workflows',
    description: 'Understand the current signature cleanup workflow, when to keep PNG vs JPG output, and how the live tool handles whitespace trimming and best-effort file-size limits.',
  },
  'image-tools': {
    slug: 'image-tools',
    href: formatPagePath('image-tools'),
    label: 'Image Tools Guide',
    title: 'Utility image tools for current live workflows',
    description: 'Browse the current utility workflows beyond basic resize and compress pages, including signature cleanup and grid-based image splitting.',
  },
};

export function getHubInfo(slug: HubSlug): HubInfo {
  return HUBS[slug];
}

export function listHubInfos(): HubInfo[] {
  return [
    HUBS['compress-image'],
    HUBS['resize-image'],
    HUBS['youtube-image-sizes'],
    HUBS['signature-tools'],
    HUBS['image-tools'],
  ];
}

export function getHubForRoute(route: RouteConfig): HubInfo {
  if (route.intent === 'signature') {
    return HUBS['signature-tools'];
  }

  if (route.intent === 'image-splitter') {
    return HUBS['image-tools'];
  }

  if (route.platform === 'youtube') {
    return HUBS['youtube-image-sizes'];
  }

  if (route.action === 'compress') {
    return HUBS['compress-image'];
  }

  return HUBS['resize-image'];
}

export function getRouteBreadcrumbs(route: RouteConfig): BreadcrumbItem[] {
  const hub = getHubForRoute(route);

  return [
    { href: '/', label: 'Home' },
    { href: hub.href, label: hub.label },
    { href: formatPagePath(route.slug), label: route.seo.h1 },
  ];
}

export function getHubBreadcrumbs(slug: HubSlug): BreadcrumbItem[] {
  const hub = getHubInfo(slug);

  return [
    { href: '/', label: 'Home' },
    { href: hub.href, label: hub.label },
  ];
}

export function getGuideLinksForRoute(route: RouteConfig): GuideLink[] {
  const hub = getHubForRoute(route);

  const links: GuideLink[] = [
    {
      href: hub.href,
      label: hub.label,
      description: hub.description,
    },
    {
      href: formatPagePath('supported-formats'),
      label: 'Supported Formats and Limits',
      description: 'Double-check current public guarantees, unsupported workflows, and what the live site can safely promise today.',
    },
    {
      href: formatPagePath('why-image-size-is-best-effort'),
      label: 'Why target size is best-effort',
      description: 'See why exact file size depends on image content, format, and compression tradeoffs before you treat a target budget like a guarantee.',
    },
    {
      href: formatPagePath('jpeg-vs-png-vs-webp-for-upload-limits'),
      label: 'JPEG vs PNG vs WebP guide',
      description: 'Compare the current supported formats and choose the right one when upload size, transparency, or visual fidelity matters most.',
    },
  ];

  if (route.action === 'compress') {
    links.push({
      href: formatPagePath('resize-image'),
      label: 'Resize Image Guide',
      description: 'Need to hit a file-size target by shrinking dimensions instead of only changing compression? Start here.',
    });
  } else if (route.platform === 'youtube') {
    links.push({
      href: formatPagePath('resize-image'),
      label: 'Resize Image Guide',
      description: 'If you need a smaller file instead of a fixed YouTube canvas, compare the live resize-by-size pages here.',
    });
  } else {
    links.push({
      href: formatPagePath('compress-image'),
      label: 'Compress Image Guide',
      description: 'If your next constraint is upload size rather than exact dimensions, compare the current compression pages here.',
    });
  }

  return links;
}
