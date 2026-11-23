/**
 * Network access to Wiktionary. Everything else works on the HTML this
 * returns, so switching endpoint (or adding a proxy) only touches this file.
 *
 * Uses the MediaWiki Core REST API, which serves Parsoid HTML with CORS
 * enabled, so the browser can call it directly.
 */

const BASE = 'https://en.wiktionary.org/w/rest.php/v1';

export type WiktionaryErrorKind = 'not-found' | 'rate-limited' | 'network' | 'http';

export class WiktionaryError extends Error {
  readonly kind: WiktionaryErrorKind;
  /** Seconds the server asked us to wait, for `rate-limited`. */
  readonly retryAfter?: number;

  constructor(kind: WiktionaryErrorKind, message: string, retryAfter?: number) {
    super(message);
    this.name = 'WiktionaryError';
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

/** Normalises what a user typed into a Wiktionary page title. */
export function toPageTitle(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[‘’ʼ]/g, "'") // typographic apostrophes -> ASCII, as in page titles
    .trim()
    .replace(/\s+/g, ' ');
}

export function pageUrl(title: string): string {
  return `https://en.wiktionary.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

/** Fetches the full rendered HTML of a page. Follows wiki redirects. */
export async function fetchPageHtml(title: string, signal?: AbortSignal): Promise<string> {
  const url = `${BASE}/page/${encodeURIComponent(title.replace(/ /g, '_'))}/html`;

  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new WiktionaryError('network', 'Could not reach Wiktionary');
  }

  if (res.status === 404) {
    throw new WiktionaryError('not-found', `No page titled "${title}"`);
  }
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after'));
    throw new WiktionaryError(
      'rate-limited',
      'Wiktionary is rate limiting requests',
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }
  if (!res.ok) {
    throw new WiktionaryError('http', `Wiktionary responded with ${res.status}`);
  }
  return res.text();
}
