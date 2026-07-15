import { describe, expect, it, vi } from 'vitest';
import {
  BATCH_SIZE,
  DEFAULT_HOST,
  DEFAULT_ORIGIN,
  INDEXNOW_API,
  dedupeUrls,
  main,
  normalizeAndValidateUrl,
  parseArgs,
  resolveIndexNowKey,
  submitIndexNow,
} from '../scripts/submit-indexnow.js';

const TEST_KEY = '4ca258e2-7679-4bfb-85fd-97c5855d7a1a';
const KEY_LOCATION = `${DEFAULT_ORIGIN}/${TEST_KEY}.txt`;

describe('parseArgs', () => {
  it('parses --url and --confirm-submit', () => {
    const result = parseArgs([
      '--url',
      'https://localresizer.com/a',
      '--url',
      'https://localresizer.com/b',
      '--confirm-submit',
    ]);
    expect(result.urls).toEqual(['https://localresizer.com/a', 'https://localresizer.com/b']);
    expect(result.confirm).toBe(true);
  });

  it('rejects invocation with no URLs', () => {
    expect(() => parseArgs([])).toThrow('At least one --url is required.');
  });

  it('rejects missing --url value', () => {
    expect(() => parseArgs(['--url'])).toThrow('Missing value for --url');
    expect(() => parseArgs(['--url', '--confirm-submit'])).toThrow('Missing value for --url');
  });

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['--url', 'https://localresizer.com/a', '--force'])).toThrow('Unknown flag: --force');
  });

  it('rejects positional arguments', () => {
    expect(() => parseArgs(['https://localresizer.com/a'])).toThrow('Unexpected positional argument');
  });
});

describe('normalizeAndValidateUrl', () => {
  it('accepts valid HTTPS URLs on the configured host', () => {
    expect(normalizeAndValidateUrl('https://localresizer.com/path')).toBe('https://localresizer.com/path');
  });

  it('accepts the homepage URL and normalizes both origin forms', () => {
    expect(normalizeAndValidateUrl('https://localresizer.com')).toBe('https://localresizer.com/');
    expect(normalizeAndValidateUrl('https://localresizer.com/')).toBe('https://localresizer.com/');
  });

  it('preserves query strings', () => {
    expect(normalizeAndValidateUrl('https://localresizer.com/path?a=1&b=2')).toBe(
      'https://localresizer.com/path?a=1&b=2',
    );
  });

  it('rejects non-HTTPS URLs', () => {
    expect(() => normalizeAndValidateUrl('http://localresizer.com/path')).toThrow('must use HTTPS');
  });

  it('rejects foreign hosts', () => {
    expect(() => normalizeAndValidateUrl('https://example.com/path')).toThrow('host must be localresizer.com');
  });

  it('rejects subdomains', () => {
    expect(() => normalizeAndValidateUrl('https://www.localresizer.com/path')).toThrow(
      'host must be localresizer.com',
    );
  });

  it('rejects credentials', () => {
    expect(() => normalizeAndValidateUrl('https://user:pass@localresizer.com/path')).toThrow(
      'must not contain credentials',
    );
  });

  it('rejects fragments', () => {
    expect(() => normalizeAndValidateUrl('https://localresizer.com/path#section')).toThrow(
      'must not contain a fragment',
    );
  });

  it('rejects non-default ports', () => {
    expect(() => normalizeAndValidateUrl('https://localresizer.com:8080/path')).toThrow('non-default port');
  });
});

describe('dedupeUrls', () => {
  it('deduplicates URLs in input order', () => {
    const input = [
      'https://localresizer.com/b',
      'https://localresizer.com/a',
      'https://localresizer.com/b',
      'https://localresizer.com/c',
    ];
    expect(dedupeUrls(input)).toEqual([
      'https://localresizer.com/b',
      'https://localresizer.com/a',
      'https://localresizer.com/c',
    ]);
  });

  it('treats the two homepage forms as the same URL after normalization', () => {
    const input = [
      'https://localresizer.com',
      'https://localresizer.com/',
      'https://localresizer.com/a',
      'https://localresizer.com',
    ];
    const normalized = input.map((url) => normalizeAndValidateUrl(url));
    expect(dedupeUrls(normalized)).toEqual([
      'https://localresizer.com/',
      'https://localresizer.com/a',
    ]);
  });
});

describe('resolveIndexNowKey', () => {
  it('returns the env key when provided', () => {
    expect(resolveIndexNowKey({ envKey: TEST_KEY })).toBe(TEST_KEY);
  });

  it('prefers the env key over the public dir', () => {
    expect(resolveIndexNowKey({ envKey: TEST_KEY, publicDir: '/nonexistent' })).toBe(TEST_KEY);
  });

  it('returns an empty string when no key is available', () => {
    expect(resolveIndexNowKey({})).toBe('');
  });
});

describe('submitIndexNow dry-run', () => {
  it('performs zero HTTP calls and exposes ordered deduplicated URL batches', async () => {
    const fetchMock = vi.fn();
    const result = await submitIndexNow({
      urls: [
        'https://localresizer.com/a',
        'https://localresizer.com/b',
        'https://localresizer.com/a',
        'https://localresizer.com',
        'https://localresizer.com/',
      ],
      key: TEST_KEY,
      confirm: false,
      fetch: fetchMock,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.submitted).toBe(false);
    expect(result.count).toBe(3);
    expect(result.batches).toEqual([
      ['https://localresizer.com/a', 'https://localresizer.com/b', 'https://localresizer.com/'],
    ]);
  });
});

describe('submitIndexNow live submission', () => {
  function createFetchMock(keyText: string, responses: Array<{ status: number; body?: string }>) {
    let callIndex = 0;
    return vi.fn(async (url: string, init?: RequestInit) => {
      if (url === KEY_LOCATION) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => keyText,
        } as Response;
      }

      if (url !== INDEXNOW_API || init?.method !== 'POST') {
        throw new Error(`Unexpected request: ${url}`);
      }

      const response = responses[callIndex];
      callIndex += 1;
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.status === 200 ? 'OK' : 'Accepted',
        text: async () => response.body ?? '',
      } as Response;
    });
  }

  it('validates the key file and posts the exact payload to the neutral IndexNow endpoint', async () => {
    const fetchMock = createFetchMock(TEST_KEY, [{ status: 200 }]);
    const urls = ['https://localresizer.com/page-1', 'https://localresizer.com/page-2?x=1'];

    const result = await submitIndexNow({ urls, key: TEST_KEY, confirm: true, fetch: fetchMock });

    expect(result.submitted).toBe(true);
    expect(result.count).toBe(2);
    expect(result.batches).toEqual([{ status: 200, count: 2 }]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, KEY_LOCATION);

    const [, postInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(postInit.method).toBe('POST');
    expect(postInit.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(postInit.body as string)).toEqual({
      host: DEFAULT_HOST,
      key: TEST_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    });
  });

  it('accepts a 200 response', async () => {
    const fetchMock = createFetchMock(TEST_KEY, [{ status: 200 }]);
    const result = await submitIndexNow({
      urls: ['https://localresizer.com/a'],
      key: TEST_KEY,
      confirm: true,
      fetch: fetchMock,
    });

    expect(result.batches?.map((b) => b.status)).toEqual([200]);
  });

  it('accepts a 202 response', async () => {
    const fetchMock = createFetchMock(TEST_KEY, [{ status: 202 }]);
    const result = await submitIndexNow({
      urls: ['https://localresizer.com/a'],
      key: TEST_KEY,
      confirm: true,
      fetch: fetchMock,
    });

    expect(result.batches?.map((b) => b.status)).toEqual([202]);
  });

  it('does not POST when the key file content does not match', async () => {
    const fetchMock = createFetchMock('wrong-key', []);
    await expect(
      submitIndexNow({
        urls: ['https://localresizer.com/a'],
        key: TEST_KEY,
        confirm: true,
        fetch: fetchMock,
      }),
    ).rejects.toThrow('Key file content mismatch');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenNthCalledWith(1, KEY_LOCATION);
  });

  it('throws when the submission endpoint returns an error', async () => {
    const fetchMock = createFetchMock(TEST_KEY, [{ status: 400, body: 'Bad Request' }]);
    await expect(
      submitIndexNow({
        urls: ['https://localresizer.com/a'],
        key: TEST_KEY,
        confirm: true,
        fetch: fetchMock,
      }),
    ).rejects.toThrow('IndexNow submission failed: 400 Bad Request');
  });

  it('batches URLs at the 10,000 limit', async () => {
    const urls = Array.from({ length: BATCH_SIZE + 1 }, (_, i) => `https://localresizer.com/page-${i}`);
    const fetchMock = createFetchMock(TEST_KEY, [{ status: 200 }, { status: 202 }]);
    const result = await submitIndexNow({ urls, key: TEST_KEY, confirm: true, fetch: fetchMock });

    expect(result.count).toBe(BATCH_SIZE + 1);
    expect(result.batches).toEqual([
      { status: 200, count: BATCH_SIZE },
      { status: 202, count: 1 },
    ]);

    const postCalls = fetchMock.mock.calls.filter(([url]) => url === INDEXNOW_API);
    expect(postCalls).toHaveLength(2);
    const [_, firstInit] = postCalls[0] as [string, RequestInit];
    const [__, secondInit] = postCalls[1] as [string, RequestInit];
    expect(JSON.parse(firstInit.body as string).urlList).toHaveLength(BATCH_SIZE);
    expect(JSON.parse(secondInit.body as string).urlList).toHaveLength(1);
  });
});

describe('main', () => {
  it('errors when no URLs are supplied', async () => {
    await expect(main([], {})).rejects.toThrow('At least one --url is required.');
  });

  it('errors when no key can be resolved', async () => {
    await expect(
      main(['--url', 'https://localresizer.com/a'], {}, { fetch: vi.fn(), publicDir: '/nonexistent' }),
    ).rejects.toThrow('No IndexNow key found');
  });
});
