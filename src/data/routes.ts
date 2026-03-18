export type {
  Action,
  Dimensions,
  FaqItem,
  Format,
  ResizeMode,
  RouteConfig,
  SEOMeta,
  Tier,
} from './route-types';

export {
  ACTIVE_SLUGS,
  FORMATS,
  MIME_MAP,
  PHASE0_SLUGS,
  PLATFORM_ASSETS,
  RESIZE_IMAGE_SIZES,
  SIZE_TIERS_KB,
  SIZE_TIERS_MB,
  STATIC_IMAGE_ACCEPT_FORMATS,
} from './route-constants';

export {
  assetLabel,
  capitalize,
  formatLabel,
  formatSizeLabel,
  parseSize,
  platformLabel,
} from './route-formatters';

export { compressFaq, platformFaq, resizeImageFaq } from './route-faq';

import { buildRelatedLinks, generateActiveRoutes, pruneRelatedLinks } from './route-builders';
import { PHASE0_SLUGS } from './route-constants';
import type { RouteConfig } from './route-types';

const generatedRoutes: RouteConfig[] = generateActiveRoutes();

buildRelatedLinks(generatedRoutes);
pruneRelatedLinks(generatedRoutes, PHASE0_SLUGS);

export const activeRoutes: RouteConfig[] = generatedRoutes;
export const phase0Routes = activeRoutes;

export function getRouteBySlug(slug: string): RouteConfig | undefined {
  return activeRoutes.find((route) => route.slug === slug);
}
