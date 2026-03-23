import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const CAPABILITIES_DOC = path.join(ROOT, 'docs', 'current-public-capabilities.md');
const SITEMAP_FILE = path.join(DIST_DIR, 'sitemap-0.xml');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readUtf8(filePath) {
  return readFileSync(filePath, 'utf-8');
}

function parseLiveToolSlugs(markdown) {
  const lines = markdown.split(/\r?\n/);
  const slugs = [];
  let insideList = false;

  for (const line of lines) {
    if (line.trim() === 'The current public release includes 8 focused tool pages:') {
      insideList = true;
      continue;
    }

    if (!insideList) {
      continue;
    }

    const match = line.match(/^- `([^`]+)`$/);
    if (match) {
      slugs.push(match[1]);
      continue;
    }

    if (slugs.length > 0 && line.trim() === '') {
      break;
    }
  }

  return slugs;
}

function parseSitemapUrls(xml) {
  const parser = new XMLParser();
  const parsed = parser.parse(xml);
  const rawEntries = parsed.urlset?.url ?? [];
  const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  return entries
    .map((entry) => (entry && typeof entry === 'object' ? entry.loc : undefined))
    .filter((value) => typeof value === 'string' && value.length > 0);
}

function toPathname(url) {
  return new URL(url).pathname.replace(/\/+$/, '') || '/';
}

function getTitle(html) {
  return html.match(/<title>(.*?)<\/title>/i)?.[1] ?? '';
}

function getFirstH1(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) {
    return '';
  }

  return decodeHtml(stripTags(match[1])).trim();
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, '');
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'');
}

function extractJsonLd(html) {
  const matches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  return matches
    .map((match) => match[1]?.trim())
    .filter(Boolean)
    .map((payload) => JSON.parse(payload));
}

function assertRouteHtml(slug, htmlFile) {
  const html = readUtf8(htmlFile);
  const title = getTitle(html);
  const h1 = getFirstH1(html);
  const jsonLd = extractJsonLd(html);
  const faqSchema = jsonLd.find((item) => item?.['@type'] === 'FAQPage');
  const howToSchema = jsonLd.find((item) => item?.['@type'] === 'HowTo');
  const breadcrumbSchema = jsonLd.find((item) => item?.['@type'] === 'BreadcrumbList');

  assert(title.includes('LocalResizer'), `Built route page is missing LocalResizer in <title>: ${slug}`);
  assert(h1.length > 0, `Built route page is missing a visible <h1>: ${slug}`);
  assert(
    html.includes('Static images only - Processed locally'),
    `Built route page lost the static-image scope badge: ${slug}`,
  );
  assert(
    html.includes('What this page is best for'),
    `Built route page lost the page-fit content section: ${slug}`,
  );
  assert(
    html.includes('How this live page differs from nearby workflows'),
    `Built route page lost the deeper-context section: ${slug}`,
  );
  assert(faqSchema, `Built route page is missing FAQ schema: ${slug}`);
  assert(howToSchema, `Built route page is missing HowTo schema: ${slug}`);
  assert(breadcrumbSchema, `Built route page is missing BreadcrumbList schema: ${slug}`);
  assert(
    Array.isArray(faqSchema.mainEntity) && faqSchema.mainEntity.length >= 5,
    `Built route page FAQ schema is incomplete: ${slug}`,
  );
  assert(
    Array.isArray(howToSchema.step) && howToSchema.step.length === 3,
    `Built route page HowTo schema step count changed: ${slug}`,
  );
}

function main() {
  assert(existsSync(DIST_DIR), `dist directory not found: ${DIST_DIR}`);
  assert(existsSync(CAPABILITIES_DOC), `capabilities doc not found: ${CAPABILITIES_DOC}`);
  assert(existsSync(SITEMAP_FILE), `sitemap file not found: ${SITEMAP_FILE}`);

  const liveSlugs = parseLiveToolSlugs(readUtf8(CAPABILITIES_DOC));
  assert(liveSlugs.length > 0, 'No live tool slugs found in docs/current-public-capabilities.md.');

  const urls = parseSitemapUrls(readUtf8(SITEMAP_FILE));
  const pathnames = new Set(urls.map(toPathname));

  const staticPages = [
    '/',
    '/about',
    '/compress-image',
    '/contact',
    '/jpeg-vs-png-vs-webp-for-upload-limits',
    '/privacy',
    '/resize-image',
    '/supported-formats',
    '/terms',
    '/why-image-size-is-best-effort',
    '/youtube-image-sizes',
  ];

  for (const pathname of staticPages) {
    assert(pathnames.has(pathname), `Missing expected static page in sitemap: ${pathname}`);
  }

  for (const slug of liveSlugs) {
    const pathname = `/${slug}`;
    assert(pathnames.has(pathname), `Missing documented live route in sitemap: ${pathname}`);

    const htmlFile = path.join(DIST_DIR, slug, 'index.html');
    assert(existsSync(htmlFile), `Missing built HTML file for documented live route: ${htmlFile}`);
    assertRouteHtml(slug, htmlFile);
  }

  assert(urls.length === staticPages.length + liveSlugs.length, `Unexpected sitemap URL count: ${urls.length}`);

  const forbiddenRouteTerms = ['/gif', '/video'];
  for (const pathname of pathnames) {
    for (const term of forbiddenRouteTerms) {
      assert(!pathname.includes(term), `Unexpected live route containing unsupported term "${term}": ${pathname}`);
    }
  }

  const homeHtml = readUtf8(path.join(DIST_DIR, 'index.html'));
  assert(homeHtml.includes('Static images only'), 'Homepage no longer states the static-image-only scope.');
  assert(homeHtml.includes('What the current public release actually does'), 'Homepage live-scope section is missing.');
  assert(homeHtml.includes('Start with the right guide'), 'Homepage guide section is missing.');

  const supportedHtml = readUtf8(path.join(DIST_DIR, 'supported-formats', 'index.html'));
  assert(
    supportedHtml.includes('Animated GIF workflows are not part of the current public release.'),
    'Supported formats page lost the current GIF exclusion text.',
  );
  assert(
    supportedHtml.includes('Why target size is best-effort'),
    'Supported formats page lost the best-effort explainer link.',
  );
  assert(
    supportedHtml.includes('JPEG vs PNG vs WebP guide'),
    'Supported formats page lost the format-comparison explainer link.',
  );

  const contactHtml = readUtf8(path.join(DIST_DIR, 'contact', 'index.html'));
  assert(contactHtml.includes('support@localresizer.com'), 'Contact page lost the support@localresizer.com email.');
  assert(contactHtml.includes('What to Contact Us About'), 'Contact page lost the support-scope section.');

  const aboutHtml = readUtf8(path.join(DIST_DIR, 'about', 'index.html'));
  assert(aboutHtml.includes('How We Publish Pages'), 'About page lost the publishing-approach section.');

  const termsHtml = readUtf8(path.join(DIST_DIR, 'terms', 'index.html'));
  assert(termsHtml.includes('Current Service Stage'), 'Terms page lost the current-service-stage section.');

  const bestEffortHtml = readUtf8(path.join(DIST_DIR, 'why-image-size-is-best-effort', 'index.html'));
  assert(
    bestEffortHtml.includes('Why image size targets are best-effort'),
    'Best-effort support page lost its core heading.',
  );

  const formatGuideHtml = readUtf8(path.join(DIST_DIR, 'jpeg-vs-png-vs-webp-for-upload-limits', 'index.html'));
  assert(
    formatGuideHtml.includes('JPEG vs PNG vs WebP for upload limits'),
    'Format-comparison support page lost its core heading.',
  );

  console.log(`dist smoke checks passed for ${urls.length} pages and ${liveSlugs.length} documented live tool routes.`);
}

main();
