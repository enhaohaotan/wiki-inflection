import type { LanguageEntry } from '../../core/types';
import type { LanguageModule, SectionFetcher } from '../../languages/registry';
import { fetchPageHtml, toPageTitle, WiktionaryError } from '../../wiktionary/client';
import { findLanguageSection, listLanguages, parsePage } from '../../wiktionary/page';
import { readCache, readForms, writeCache, writeForms } from './cache';

/** Set when the word looked up is an inflected form, e.g. "vais" shown as "aller". */
export interface FormMatch {
  /** The page that was looked up, e.g. "vais". */
  form: string;
  /** Dictionary forms Wiktionary says it belongs to, most likely first. */
  lemmas: string[];
  /** The entry in `lemmas` that is being shown. */
  lemma: string;
}

export type LookupResult =
  | { status: 'ok'; entry: LanguageEntry; match?: FormMatch }
  /** No page with that title exists. */
  | { status: 'not-found'; query: string }
  /** The page exists but has no entry in the requested language. */
  | { status: 'no-language'; query: string; available: string[] }
  /** The language entry exists but has nothing we can show (not a verb or a form of one). */
  | { status: 'no-inflection'; query: string }
  | { status: 'error'; kind: 'rate-limited' | 'network' | 'http'; retryAfter?: number };

/** How many "form of" links to follow, e.g. allée -> allé -> aller. */
const MAX_HOPS = 2;

interface Page {
  doc: Document;
  /** The section for the lookup language, if the page has one. */
  section: Element | null;
}

/** Fetches a page; null when it does not exist. Throws WiktionaryError otherwise. */
async function loadPage(language: LanguageModule, title: string, signal?: AbortSignal): Promise<Page | null> {
  let html: string;
  try {
    html = await fetchPageHtml(title, signal);
  } catch (err) {
    if (err instanceof WiktionaryError && err.kind === 'not-found') return null;
    throw err;
  }
  const doc = parsePage(html);
  return { doc, section: findLanguageSection(doc, language.heading) };
}

function sectionFetcher(language: LanguageModule, signal?: AbortSignal): SectionFetcher {
  return async (title) => (await loadPage(language, title, signal))?.section ?? null;
}

/** Titles to try, most literal first. Phone keyboards capitalise the first letter. */
function candidates(query: string): string[] {
  const title = toPageTitle(query);
  const lower = title.toLocaleLowerCase('fr');
  return lower === title ? [title] : [title, lower];
}

/** Parses an entry and runs the language's enrichment step, caching the result. */
async function finishEntry(
  language: LanguageModule,
  title: string,
  section: Element,
  signal?: AbortSignal,
): Promise<LanguageEntry | null> {
  let entry = language.parse(section, title);
  if (entry.tables.length === 0) return null;

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
  return entry;
}

/** The entry for a dictionary form, following further "form of" links if needed. */
async function resolveLemma(
  language: LanguageModule,
  title: string,
  hops: number,
  signal?: AbortSignal,
): Promise<LanguageEntry | null> {
  const cached = readCache(language.code, title);
  if (cached) return cached;

  const page = await loadPage(language, title, signal);
  if (!page?.section) return null;

  const entry = await finishEntry(language, title, page.section, signal);
  if (entry) return entry;

  if (hops >= MAX_HOPS) return null;
  for (const next of language.lemmasOf?.(page.section, title) ?? []) {
    const found = await resolveLemma(language, next, hops + 1, signal);
    if (found) return found;
  }
  return null;
}

/** Shows the first lemma of `form` that has an inflection table, `preferred` first. */
async function viaLemmas(
  language: LanguageModule,
  form: string,
  lemmas: string[],
  preferred: string | undefined,
  signal?: AbortSignal,
): Promise<LookupResult | null> {
  const order = preferred && lemmas.includes(preferred) ? [preferred, ...lemmas.filter((l) => l !== preferred)] : lemmas;
  for (const lemma of order) {
    const entry = await resolveLemma(language, lemma, 1, signal);
    if (entry) return { status: 'ok', entry, match: { form, lemmas, lemma } };
  }
  return null;
}

/**
 * Looks up `query`. If it is an inflected form ("vais"), shows the
 * dictionary form it belongs to ("aller") with `match` set; `preferredLemma`
 * picks among several ("suis" -> être or suivre).
 */
export async function lookup(
  language: LanguageModule,
  query: string,
  signal?: AbortSignal,
  preferredLemma?: string,
): Promise<LookupResult> {
  // When nothing can be shown, report the most specific reason found, and for
  // equally specific ones the title closest to what was typed.
  const RANK = { 'not-found': 0, 'no-language': 1, 'no-inflection': 2 } as const;
  type Miss = Extract<LookupResult, { status: keyof typeof RANK }>;
  let fallback: Miss = { status: 'not-found', query: toPageTitle(query) };
  const miss = (next: Miss) => {
    if (RANK[next.status] > RANK[fallback.status]) fallback = next;
  };

  try {
    const titles = candidates(query);

    for (const title of titles) {
      const cached = readCache(language.code, title);
      if (cached) return { status: 'ok', entry: cached };
      const forms = readForms(language.code, title);
      if (forms) {
        const result = await viaLemmas(language, title, forms, preferredLemma, signal);
        if (result) return result;
      }
    }

    for (const title of titles) {
      const page = await loadPage(language, title, signal);
      if (!page) continue;
      if (!page.section) {
        miss({ status: 'no-language', query: title, available: listLanguages(page.doc) });
        continue;
      }

      const entry = await finishEntry(language, title, page.section, signal);
      if (entry) return { status: 'ok', entry };

      // Not a dictionary form with a table: maybe an inflected form of one.
      const lemmas = language.lemmasOf?.(page.section, title) ?? [];
      if (lemmas.length > 0) {
        writeForms(language.code, title, lemmas);
        const result = await viaLemmas(language, title, lemmas, preferredLemma, signal);
        if (result) return result;
      }
      miss({ status: 'no-inflection', query: title });
    }
    return fallback;
  } catch (err) {
    if (err instanceof WiktionaryError && err.kind !== 'not-found') {
      return { status: 'error', kind: err.kind, retryAfter: err.retryAfter };
    }
    throw err;
  }
}
