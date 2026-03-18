export type Action = 'compress' | 'resize';
export type Format = 'jpeg' | 'png' | 'webp';
export type Tier = 1 | 2 | 3 | 4;
export type ResizeMode = 'fit' | 'contain' | 'cover' | 'stretch';

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
  format?: Format;
  targetSize?: string;
  targetSizeBytes?: number;
  platform?: string;
  asset?: string;
  dimensions?: Dimensions;
  tier: Tier;
  seo: SEOMeta;
  faq: FaqItem[];
  howToSteps: string[];
  relatedLinks: string[];
  acceptFormats: string[];
  maxFileSize: number;
  resizeMode?: ResizeMode;
  forceCanvasSize?: boolean;
}
