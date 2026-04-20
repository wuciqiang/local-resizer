import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const SITE_URL = process.env.SITE_URL?.trim() || 'https://localresizer.com';
const SITEMAP_PATH = process.env.SITEMAP_PATH?.trim() || './dist/sitemap-0.xml';

function resolveIndexNowKey() {
  const envKey = process.env.INDEXNOW_KEY?.trim();
  if (envKey) {
    return envKey;
  }

  if (!existsSync(PUBLIC_DIR)) {
    return '';
  }

  const keyFile = readdirSync(PUBLIC_DIR).find((fileName) => {
    if (!/^[0-9a-f-]{36}\.txt$/i.test(fileName)) {
      return false;
    }

    const keyFromName = path.basename(fileName, '.txt');
    const keyFilePath = path.join(PUBLIC_DIR, fileName);
    const keyFromFile = readFileSync(keyFilePath, 'utf-8').trim();
    return keyFromFile === keyFromName;
  });

  return keyFile ? path.basename(keyFile, '.txt') : '';
}

const INDEXNOW_KEY = resolveIndexNowKey();

/**
 * @param {string[]} urls
 */
async function submitToIndexNow(urls) {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });

  if (response.ok) {
    console.log(`Submitted ${urls.length} URLs to IndexNow.`);
    return;
  }

  const body = await response.text();
  throw new Error(`IndexNow submission failed: ${response.status} ${body}`.trim());
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeUrls(value) {
  if (!value) {
    return [];
  }

  const entries = Array.isArray(value) ? value : [value];
  return entries
    .map((entry) => (entry && typeof entry === 'object' ? entry.loc : undefined))
    .filter((loc) => typeof loc === 'string' && loc.length > 0);
}

async function main() {
  if (!INDEXNOW_KEY) {
    console.log('Skipping IndexNow submission because no IndexNow key was found in env or public/*.txt.');
    return;
  }

  const sitemapFile = path.resolve(SITEMAP_PATH);
  if (!existsSync(sitemapFile)) {
    throw new Error(`Sitemap file not found: ${sitemapFile}`);
  }

  const sitemapXml = readFileSync(sitemapFile, 'utf-8');
  const parser = new XMLParser();
  const sitemap = parser.parse(sitemapXml);
  const urls = normalizeUrls(sitemap.urlset?.url);

  if (urls.length === 0) {
    console.log(`Skipping IndexNow submission because no URLs were found in ${sitemapFile}.`);
    return;
  }

  console.log(`Found ${urls.length} URLs in ${path.basename(sitemapFile)}.`);

  const batchSize = 10_000;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await submitToIndexNow(batch);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
