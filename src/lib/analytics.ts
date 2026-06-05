export type AnalyticsParamValue = string | number | boolean | undefined | null;
export type AnalyticsParams = Record<string, AnalyticsParamValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    lrTrackEvent?: (eventName: string, params?: AnalyticsParams) => void;
  }
}

const blockedAnalyticsParams = new Set([
  'email',
  'name',
  'file_name',
  'fileName',
  'url',
  'image_url',
  'result_url',
  'user_agent',
]);

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return;

  const payload = cleanAnalyticsParams({
    page_id: analyticsPageId(),
    ...params,
  });

  if (typeof window.lrTrackEvent === 'function') {
    window.lrTrackEvent(eventName, payload);
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }
}

export function trackToolEvent(eventName: string, params: AnalyticsParams = {}) {
  trackEvent(eventName, {
    category: 'tool',
    tool_name: 'local_resizer',
    ...params,
  });
}

export function analyticsPageId(pathname = typeof window === 'undefined' ? '/' : window.location.pathname): string {
  const pageId = pathname.split('/').filter(Boolean).join('_');
  return pageId || 'home';
}

export function fileCountBucket(count: number): string {
  if (count <= 1) return '1';
  if (count <= 5) return '2_5';
  if (count <= 10) return '6_10';
  return '11_20';
}

export function gridCountBucket(count: number): string {
  if (!Number.isFinite(count) || count < 1) return 'invalid';
  if (count <= 5) return String(count);
  if (count <= 10) return '6_10';
  return '11_plus';
}

export function sizeBucket(bytes: number): string {
  if (bytes <= 100 * 1024) return 'under_100kb';
  if (bytes <= 500 * 1024) return '100kb_500kb';
  if (bytes <= 1024 * 1024) return '500kb_1mb';
  if (bytes <= 5 * 1024 * 1024) return '1mb_5mb';
  if (bytes <= 20 * 1024 * 1024) return '5mb_20mb';
  return 'over_20mb';
}

export function mimeFormat(mimeType?: string): string {
  if (mimeType === 'image/jpeg') return 'jpeg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'unknown';
}

export function fileFormatSummary(files: File[]): string {
  const formats = Array.from(new Set(files.map((file) => mimeFormat(file.type))));
  if (formats.length === 0) return 'unknown';
  if (formats.length === 1) return formats[0];
  return 'mixed';
}

export function resultFormatSummary(results: Array<{ outputFormat?: string }>): string {
  const formats = Array.from(new Set(results.map((result) => mimeFormat(result.outputFormat))));
  if (formats.length === 0) return 'unknown';
  if (formats.length === 1) return formats[0];
  return 'mixed';
}

function normalizeAnalyticsParam(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 80);
}

function cleanAnalyticsParams(params: AnalyticsParams): AnalyticsParams {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([key, value]) => !blockedAnalyticsParams.has(key) && value !== undefined && value !== null)
      .map(([key, value]) => [
        key,
        typeof value === 'string' ? normalizeAnalyticsParam(value) : value,
      ]),
  );
}
