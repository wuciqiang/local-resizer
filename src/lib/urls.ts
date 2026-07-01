export const SITE_ORIGIN = 'https://localresizer.com';

export function formatPagePath(pathname: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (normalizedPath === '/') {
    return '/';
  }

  return `${normalizedPath.replace(/\/+$/, '')}/`;
}

export function formatPageUrl(pathname: string): string {
  return new URL(formatPagePath(pathname), SITE_ORIGIN).href;
}
