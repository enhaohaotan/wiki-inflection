import type { LanguageEntry } from '../../core/types';
import type { LanguageModule, SectionFetcher } from '../../languages/registry';
import { fetchPageHtml, toPageTitle, WiktionaryError } from '../../wiktionary/client';
import { findLanguageSection, listLanguages, parsePage } from '../../wiktionary/page';
import { readCache, writeCache } from './cache';

export type LookupResult =
  | { status: 'ok'; entry: LanguageEntry }
  /** No page with that title exists. */
  | { status: 'not-found'; query: string }
  /** The page exists but has no entry in the requested language. */
  | { status: 'no-language'; query: string; available: string[] }
  /** The language entry exists but has nothing we can show yet (e.g. not a verb). */
  | { status: 'no-inflection'; query: string }
  | { status: 'error'; kind: 'rate-limited' | 'network' | 'http'; retryAfter?: number };

function sectionFetcher(language: LanguageModule, signal?: AbortSignal): SectionFetcher {
  return async (title) => {
    let html: string;
    try {
      html = await fetchPageHtml(title, signal);
    } catch (err) {
      if (err instanceof WiktionaryError && err.kind === 'not-found') return null;
      throw err;
    }
    return findLanguageSection(parsePage(html), language.heading);
  };
}

/** Titles to try, most literal first. Phone keyboards capitalise the first letter. */
function candidates(query: string): string[] {
  const title = toPageTitle(query);
  const lower = title.toLocaleLowerCase('fr');
  return lower === title ? [title] : [title, lower];
}

export async function lookup(
  language: LanguageModule,
  query: string,
  signal?: AbortSignal,
): Promise<LookupResult> {
  // When nothing can be shown, report the most specific reason found, and for
  // equally specific ones the title closest to what was typed.
  const RANK = { 'not-found': 0, 'no-language': 1, 'no-inflection': 2 } as const;
  type Miss = Extract<LookupResult, { status: keyof typeof RANK }>;
  let fallback: Miss = { status: 'not-found', query: toPageTitle(query) };
  const miss = (next: Miss) => {
    if (RANK[next.status] > RANK[fallback.status]) fallback = next;
  };

  const titles = candidates(query);
  for (const title of titles) {
    const cached = readCache(language.code, title);
    if (cached) return { status: 'ok', entry: cached };
  }

  for (const title of titles) {
    let html: string;
    try {
      html = await fetchPageHtml(title, signal);
    } catch (err) {
      if (err instanceof WiktionaryError) {
        if (err.kind === 'not-found') continue;
        return { status: 'error', kind: err.kind, retryAfter: err.retryAfter };
      }
      throw err;
    }

    const doc = parsePage(html);
    const section = findLanguageSection(doc, language.heading);
    if (!section) {
      miss({ status: 'no-language', query: title, available: listLanguages(doc) });
      continue;
    }

    let entry = language.parse(section, title);
    if (entry.tables.length === 0) {
      miss({ status: 'no-inflection', query: title });
      continue;
    }

    let complete = true;
    if (language.enrich) {
      try {
        entry = await language.enrich(entry, sectionFetcher(language, signal));
      } catch (err) {
        if (signal?.aborted) throw err;
        // Show what we have; don't cache it, so the next lookup tries again.
        console.warn('Could not load extra data', err);
        complete = false;
      }
    }

    if (complete) writeCache(language.code, title, entry);
    return { status: 'ok', entry };
  }
  return fallback;
}
