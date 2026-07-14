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

function assertIncludesAny(haystack, candidates, message) {
  assert(candidates.some((candidate) => haystack.includes(candidate)), message);
}

function readUtf8(filePath) {
  return readFileSync(filePath, 'utf-8');
}

function parseLiveToolSlugs(markdown) {
  const lines = markdown.split(/\r?\n/);
  const slugs = [];
  let insideList = false;

  for (const line of lines) {
    if (/^The current public release includes \d+ focused tool pages:$/.test(line.trim())) {
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

function assertPageUrlHasTrailingSlash(url) {
  const pathname = new URL(url).pathname;

  assert(pathname === '/' || pathname.endsWith('/'), `Page URL is missing trailing slash: ${url}`);
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

function assertToolFollowsHeading(slug, html) {
  const headingIndex = html.search(/<h1\b/i);
  const uploadIndex = html.search(/<input\b[^>]*\btype="file"/i);

  assert(uploadIndex >= 0, `Built tool page is missing a file upload input: ${slug}`);
  assert(headingIndex < uploadIndex, `Built tool page renders its upload UI before the H1: ${slug}`);
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

function extractCanonical(html) {
  return html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ?? '';
}

function assertStaticGuidePage(slug, expectedH1, html) {
  const title = getTitle(html);
  const canonical = extractCanonical(html);
  const breadcrumbSchema = extractJsonLd(html).find((item) => item?.['@type'] === 'BreadcrumbList');

  assert(title.includes('LocalResizer'), `Built static guide page is missing LocalResizer in <title>: ${slug}`);
  assert(canonical === `https://localresizer.com/${slug}/`, `Built static guide page canonical URL is not normalized: ${slug}`);
  assert(getFirstH1(html) === expectedH1, `Built static guide page H1 mismatch: ${slug}`);
  assert(breadcrumbSchema, `Built static guide page is missing BreadcrumbList schema: ${slug}`);
  const robotsNoindex = [...html.matchAll(/<meta\b[^>]*>/gi)].some((tagMatch) => {
    const tag = tagMatch[0];
    if (!/\bname\s*=\s*(["']?)robots\1/i.test(tag)) return false;
    const content = tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2] ?? '';
    return /\bnoindex\b/i.test(content);
  });
  assert(!robotsNoindex, `Built static guide page contains a noindex directive: ${slug}`);
}

function assertRouteHtml(slug, htmlFile) {
  const html = readUtf8(htmlFile);
  const title = getTitle(html);
  const h1 = getFirstH1(html);
  const jsonLd = extractJsonLd(html);
  const faqSchema = jsonLd.find((item) => item?.['@type'] === 'FAQPage');
  const howToSchema = jsonLd.find((item) => item?.['@type'] === 'HowTo');
  const breadcrumbSchema = jsonLd.find((item) => item?.['@type'] === 'BreadcrumbList');
  const canonical = extractCanonical(html);

  assert(title.includes('LocalResizer'), `Built route page is missing LocalResizer in <title>: ${slug}`);
  assert(canonical === `https://localresizer.com/${slug}/`, `Built route page canonical URL is not normalized: ${slug}`);
  assert(h1.length > 0, `Built route page is missing a visible <h1>: ${slug}`);
  assertToolFollowsHeading(slug, html);
  assert(
    html.includes('Static images only - Processed locally'),
    `Built route page lost the static-image scope badge: ${slug}`,
  );
  assertIncludesAny(
    html,
    [
      'What this page is best for',
      'How to resize a signature image for upload',
      'How to split an image into pieces',
    ],
    `Built route page lost the page-fit content section: ${slug}`,
  );
  assertIncludesAny(
    html,
    [
      'How this live page differs from nearby workflows',
      'When to use a signature resizer instead of a generic tool',
      'When to use an image splitter instead of a crop tool',
    ],
    `Built route page lost the deeper-context section: ${slug}`,
  );
  assert(faqSchema, `Built route page is missing FAQ schema: ${slug}`);
  assert(howToSchema, `Built route page is missing HowTo schema: ${slug}`);
  assert(breadcrumbSchema, `Built route page is missing BreadcrumbList schema: ${slug}`);
  assert(
    breadcrumbSchema.itemListElement.every((item) => {
      const pathname = new URL(item.item).pathname;
      return pathname === '/' || pathname.endsWith('/');
    }),
    `Built route page breadcrumb schema has non-normalized URLs: ${slug}`,
  );
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
  urls.forEach(assertPageUrlHasTrailingSlash);
  const pathnames = new Set(urls.map(toPathname));

  const staticPages = [
    '/',
    '/about',
    '/compress-image',
    '/contact',
    '/image-tools',
    '/jpeg-vs-png-vs-webp-for-upload-limits',
    '/png-resize-transparency-test',
    '/png-transparency-after-resizing',
    '/privacy',
    '/resize-image',
    '/resize-vs-compress-png',
    '/signature-tools',
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

  const staticGuidePageChecks = [
    {
      slug: 'png-resize-transparency-test',
      h1: 'PNG resize transparency test',
      extra(html) {
        assert(
          getTitle(html) === 'PNG Resize Transparency Test | LocalResizer',
          'Evidence page title does not match the accepted value',
        );
        assert(existsSync(path.join(DIST_DIR, 'og', 'png-resize-transparency-test.png')), 'Evidence page OG image asset not copied to dist');
        assert(
          html.includes('<meta property="og:image" content="https://localresizer.com/og/png-resize-transparency-test.png">'),
          'Evidence page og:image does not name the dedicated absolute URL',
        );
        assert(
          html.includes('<meta name="twitter:image" content="https://localresizer.com/og/png-resize-transparency-test.png">'),
          'Evidence page twitter:image does not match og:image',
        );
        assert(
          html.includes('<meta property="og:image:alt" content="LocalResizer PNG resize transparency evidence view showing alpha-channel measurements from a browser-based resize test.">'),
          'Evidence page og:image:alt does not match the accepted value',
        );
        assert(
          html.includes('<meta property="og:image:width" content="1200">'),
          'Evidence page og:image:width dimension missing',
        );
        assert(
          html.includes('<meta property="og:image:height" content="630">'),
          'Evidence page og:image:height dimension missing',
        );
        assert(html.includes('2026-07-14'), 'Evidence page missing 2026-07-14 date');
        assert(html.includes('Methodology and scope'), 'Evidence page missing methodology section');
        assert(html.includes('Limitations'), 'Evidence page missing limitations section');
        assert(html.includes('href="/resize-png/"'), 'Evidence page missing link to /resize-png/');
        assert(html.includes('astro-island'), 'Evidence page missing astro-island hydration marker');
        assert(html.includes('PngResizeEvidenceLab'), 'Evidence page missing PngResizeEvidenceLab island marker');
      },
    },
    {
      slug: 'png-transparency-after-resizing',
      h1: 'PNG transparency after resizing',
      extra(html) {
        assert(html.includes('href="/png-resize-transparency-test/"'), 'Transparency guide missing evidence link');
        assert(html.includes('href="/resize-png/"'), 'Transparency guide missing resize-png link');
      },
    },
    {
      slug: 'resize-vs-compress-png',
      h1: 'Resize vs compress PNG',
      extra(html) {
        assert(html.includes('href="/png-resize-transparency-test/"'), 'Resize-vs-compress guide missing evidence link');
        assert(html.includes('href="/resize-png/"'), 'Resize-vs-compress guide missing resize-png link');
      },
    },
  ];

  for (const { slug, h1, extra } of staticGuidePageChecks) {
    const htmlFile = path.join(DIST_DIR, slug, 'index.html');
    assert(existsSync(htmlFile), `Missing built HTML file for static guide page: ${slug}`);
    const html = readUtf8(htmlFile);
    assertStaticGuidePage(slug, h1, html);
    extra(html);
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

  for (const slug of ['compress-image', 'resize-image']) {
    const html = readUtf8(path.join(DIST_DIR, slug, 'index.html'));
    assertToolFollowsHeading(slug, html);
  }

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
