import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_HOST = 'localresizer.com';
export const DEFAULT_ORIGIN = 'https://localresizer.com';
export const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
export const BATCH_SIZE = 10_000;

const KEY_FILE_RE = /^[0-9a-f-]{36}\.txt$/i;

/**
 * Resolve the IndexNow key from an explicit env value or from a public key file
 * whose content matches its file name.
 *
 * @param {Object} options
 * @param {string} [options.envKey]
 * @param {string} [options.publicDir]
 * @returns {string}
 */
export function resolveIndexNowKey({ envKey, publicDir } = {}) {
  const key = envKey?.trim();
  if (key) {
    return key;
  }

  if (!publicDir || !existsSync(publicDir)) {
    return '';
  }

  const keyFile = readdirSync(publicDir).find((fileName) => {
    if (!KEY_FILE_RE.test(fileName)) {
      return false;
    }

    const keyFromName = path.basename(fileName, '.txt');
    const keyFilePath = path.join(publicDir, fileName);
    const keyFromFile = readFileSync(keyFilePath, 'utf-8').trim();
    return keyFromFile === keyFromName;
  });

  return keyFile ? path.basename(keyFile, '.txt') : '';
}

/**
 * Parse CLI arguments. --url is repeatable. --confirm-submit enables live POSTs.
 * Everything else is rejected.
 *
 * @param {string[]} argv
 * @returns {{ urls: string[]; confirm: boolean }}
 */
export function parseArgs(argv) {
  const urls = [];
  let confirm = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--url') {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        throw new Error('Missing value for --url');
      }
      urls.push(next);
      i += 1;
    } else if (arg === '--confirm-submit') {
      confirm = true;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }
  }

  if (urls.length === 0) {
    throw new Error('At least one --url is required.');
  }

  return { urls, confirm };
}

/**
 * Validate and normalize a single URL for the configured host.
 *
 * @param {string} raw
 * @param {string} [expectedHost]
 * @returns {string}
 */
export function normalizeAndValidateUrl(raw, expectedHost = DEFAULT_HOST) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid URL: ${raw}`);
  }

  if (url.protocol !== 'https:') {
    throw new Error(`URL must use HTTPS: ${raw}`);
  }

  if (url.hostname.toLowerCase() !== expectedHost.toLowerCase()) {
    throw new Error(`URL host must be ${expectedHost}: ${raw}`);
  }

  if (url.username || url.password) {
    throw new Error(`URL must not contain credentials: ${raw}`);
  }

  if (url.hash) {
    throw new Error(`URL must not contain a fragment: ${raw}`);
  }

  if (url.port && url.port !== '443') {
    throw new Error(`URL must not specify a non-default port: ${raw}`);
  }

  return url.href;
}

/**
 * Remove duplicate URLs while preserving first-seen order.
 *
 * @param {string[]} urls
 * @returns {string[]}
 */
export function dedupeUrls(urls) {
  const seen = new Set();
  const result = [];

  for (const url of urls) {
    if (!seen.has(url)) {
      seen.add(url);
      result.push(url);
    }
  }

  return result;
}

/**
 * Submit (or dry-run) URLs to IndexNow.
 *
 * @param {Object} options
 * @param {string[]} options.urls
 * @param {string} options.key
 * @param {string} [options.host]
 * @param {string} [options.origin]
 * @param {boolean} [options.confirm]
 * @param {typeof fetch} [options.fetch]
 * @returns {Promise<{ submitted: boolean; count: number; batches?: Array<{ status: number; count: number }> | string[][] }>}
 */
export async function submitIndexNow({
  urls,
  key,
  host = DEFAULT_HOST,
  origin = DEFAULT_ORIGIN,
  confirm = false,
  fetch: fetchImpl = fetch,
}) {
  if (!key) {
    throw new Error('No IndexNow key provided.');
  }

  const validated = urls.map((url) => normalizeAndValidateUrl(url, host));
  const unique = dedupeUrls(validated);

  if (unique.length === 0) {
    throw new Error('No valid URLs to submit.');
  }

  const keyLocation = `${origin}/${key}.txt`;

  if (!confirm) {
    const batches = [];
    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
      batches.push(unique.slice(i, i + BATCH_SIZE));
    }

    console.log('[dry-run] IndexNow submission intent:');
    console.log(`  endpoint: ${INDEXNOW_API}`);
    console.log(`  host: ${host}`);
    console.log(`  urlCount: ${unique.length}`);
    console.log(`  batchCount: ${batches.length}`);
    batches.forEach((batch, index) => {
      console.log(`  batch[${index}]: ${JSON.stringify(batch)}`);
    });

    return { submitted: false, count: unique.length, batches };
  }

  const keyResponse = await fetchImpl(keyLocation);
  if (keyResponse.status !== 200) {
    throw new Error(`Key file check failed: ${keyResponse.status} ${keyResponse.statusText}`);
  }
  const keyText = (await keyResponse.text()).trim();
  if (keyText !== key) {
    throw new Error(`Key file content mismatch.`);
  }

  const batches = [];
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const payload = { host, key, keyLocation, urlList: batch };
    const response = await fetchImpl(INDEXNOW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status !== 200 && response.status !== 202) {
      const text = await response.text();
      throw new Error(`IndexNow submission failed: ${response.status} ${text}`.trim());
    }

    batches.push({ status: response.status, count: batch.length });
  }

  console.log(`Submitted ${unique.length} URL(s) to IndexNow in ${batches.length} batch(es).`);
  return { submitted: true, count: unique.length, batches };
}

/**
 * CLI entry point.
 *
 * @param {string[]} argv
 * @param {NodeJS.ProcessEnv} [env]
 * @param {Object} [deps]
 * @param {typeof fetch} [deps.fetch]
 * @param {string} [deps.publicDir]
 */
export async function main(argv, env = process.env, deps = { fetch, publicDir: path.join(process.cwd(), 'public') }) {
  const { urls, confirm } = parseArgs(argv);
  const key = resolveIndexNowKey({ envKey: env.INDEXNOW_KEY, publicDir: deps.publicDir });

  if (!key) {
    throw new Error('No IndexNow key found in env or public/*.txt.');
  }

  return submitIndexNow({ urls, key, confirm, fetch: deps.fetch, host: DEFAULT_HOST, origin: DEFAULT_ORIGIN });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
