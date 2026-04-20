export type Action = 'compress' | 'resize';
export type Format = 'jpeg' | 'png' | 'webp';
export type Tier = 1 | 2 | 3 | 4;
export type ResizeMode = 'fit' | 'contain' | 'cover' | 'stretch';
export type RouteIntent =
  | 'generic'
  | 'document-photo'
  | 'generic-compress'
  | 'format-resize';

export interface Dimensions {
  width: number;
  height: number;
}

export interface SEOMeta {
  title: string;
  description: string;
  h1: string;
  subtitle: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RouteConfig {
  slug: string;
  action: Action;
  intent?: RouteIntent;
  format?: Format;
  targetSize?: string;
  targetSizeBytes?: number;
  defaultTargetSizeBytes?: number;
  platform?: string;
  asset?: string;
  dimensions?: Dimensions;
  defaultDimensions?: Dimensions;
  tier: Tier;
  seo: SEOMeta;
  faq: FaqItem[];
  howToSteps: string[];
  relatedLinks: string[];
  acceptFormats: string[];
  maxFileSize: number;
  lockedAction?: Action;
  hideActionTabs?: boolean;
  resizeMode?: ResizeMode;
  forceCanvasSize?: boolean;
}
