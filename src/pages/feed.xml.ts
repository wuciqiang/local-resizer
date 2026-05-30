import type { APIRoute } from 'astro';
import { activeRoutes } from '../data/routes';

export const GET: APIRoute = () => {
  const siteUrl = 'https://localresizer.com';
  const buildDate = new Date().toUTCString();
  const contentPubDate = new Date('2026-04-29T00:00:00.000Z').toUTCString();

  const items = activeRoutes
    .map((route) => {
      const url = `${siteUrl}/${route.slug}`;
      return `    <item>
      <title>${escapeXml(route.seo.h1)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${contentPubDate}</pubDate>
      <description>${escapeXml(route.seo.description)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>LocalResizer - Free Online Image Compressor &amp; Resizer</title>
    <link>${siteUrl}</link>
    <description>Free browser-based image compression and resizing tool</description>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
