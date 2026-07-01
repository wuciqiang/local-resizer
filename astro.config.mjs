import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

function formatPagePath(pathname) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (normalizedPath === '/') {
    return '/';
  }

  return `${normalizedPath.replace(/\/+$/, '')}/`;
}

export default defineConfig({
  site: 'https://localresizer.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({
      serialize(item) {
        const pathname = new URL(item.url).pathname.replace(/\/+$/, '') || '/';
        item.url = new URL(formatPagePath(pathname), 'https://localresizer.com').href;

        const guidePaths = new Set([
          '/youtube-image-sizes',
          '/signature-tools',
          '/image-tools',
          '/supported-formats',
          '/why-image-size-is-best-effort',
          '/jpeg-vs-png-vs-webp-for-upload-limits',
        ]);
        const utilityPaths = new Set([
          '/about',
          '/contact',
          '/privacy',
          '/terms',
        ]);

        if (pathname === '/') {
          item.priority = 1.0;
        } else if (guidePaths.has(pathname)) {
          item.priority = 0.6;
        } else if (utilityPaths.has(pathname)) {
          item.priority = 0.4;
        } else {
          item.priority = 0.8;
        }

        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },
});
