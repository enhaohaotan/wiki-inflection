import type { LanguageEntry } from '../../core/types';

/**
 * Parsed entries are kept in localStorage so a repeat lookup is instant,
 * works offline, and does not count against Wiktionary's rate limit.
 * Only the parsed result is stored (a few KB), not the page HTML (~200 KB).
 */

// Bump when the shape of LanguageEntry or a parser's output changes.
const VERSION = 3;
const PREFIX = `wikt:v${VERSION}:`;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const RECENT_KEY = 'wikt:recent';
const MAX_RECENT = 8;

interface Stored {
  savedAt: number;
  entry: LanguageEntry;
}

const keyFor = (lang: string, title: string) => `${PREFIX}${lang}:${title}`;

export function readCache(lang: string, title: string): LanguageEntry | null {
  try {
    const raw = localStorage.getItem(keyFor(lang, title));
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    if (Date.now() - stored.savedAt > MAX_AGE_MS) return null;
    return stored.entry;
  } catch {
    return null;
  }
}

export function writeCache(lang: string, title: string, entry: LanguageEntry): void {
  const value = JSON.stringify({ savedAt: Date.now(), entry } satisfies Stored);
  try {
    localStorage.setItem(keyFor(lang, title), value);
  } catch {
    // Storage full or unavailable (private mode): drop our entries and try once more.
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('wikt:v')) localStorage.removeItem(key);
      }
      localStorage.setItem(keyFor(lang, title), value);
    } catch {
      /* caching is best-effort */
    }
  }
}

export interface RecentItem {
  lang: string;
  word: string;
}

export function readRecent(): RecentItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as RecentItem[]) : [];
  } catch {
    return [];
  }
}

export function addRecent(item: RecentItem): RecentItem[] {
  const next = [item, ...readRecent().filter((r) => r.lang !== item.lang || r.word !== item.word)].slice(
    0,
    MAX_RECENT,
  );
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* best-effort */
  }
  return next;
}
