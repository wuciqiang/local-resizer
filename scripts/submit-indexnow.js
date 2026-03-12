import { readFileSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'your-key-here';
const SITE_URL = 'https://localresizer.com';

async function submitToIndexNow(urls) {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: 'localresizer.com',
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });

  if (response.ok) {
    console.log(`✅ Submitted ${urls.length} URLs to IndexNow`);
  } else {
    console.error(`❌ IndexNow submission failed: ${response.status}`);
  }
}

async function main() {
  const sitemapXml = readFileSync('./dist/sitemap-0.xml', 'utf-8');
  const parser = new XMLParser();
  const sitemap = parser.parse(sitemapXml);

  const urls = sitemap.urlset.url.map((entry) => entry.loc);

  console.log(`Found ${urls.length} URLs in sitemap`);

  // IndexNow 限制每次最多 10,000 个 URL，分批提交
  const batchSize = 10000;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await submitToIndexNow(batch);
  }
}

main().catch(console.error);
