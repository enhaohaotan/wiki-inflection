import type { InflectionTable } from '../core/types';
import { toPageTitle } from '../wiktionary/client';

/**
 * Conjugation tables of the verbs on a language's practice list, fetched
 * from Wiktionary ahead of time by scripts/fetch-verb-tables.mjs and shipped
 * with the page (src/practice/<code>/data/verbTables.json), so those verbs
 * can be practised offline once their language has been opened. Other verbs
 * are looked up as usual.
 */

/** What is kept of a table: only what the practice sheet uses. */
export interface StoredTable {
  lemma: string;
  title: string;
  pos: string;
  inflections: { tags: string[]; forms: string[] }[];
  periphrastic: { key: string; rule: string }[];
  /** Language-specific extras some languages need, e.g. Italian's verb class ("-ere; irregular"). */
  meta?: Record<string, string>;
}

export interface SavedTables {
  /** When the tables were fetched (ISO date). */
  fetched: string;
  /** Verb as listed -> its table. */
  tables: Record<string, StoredTable>;
  /** Verbs for which no table was found, with the reason. */
  missing: Record<string, string>;
}

export function storeTable(table: InflectionTable): StoredTable {
  return {
    lemma: table.lemma,
    title: table.title,
    pos: table.pos,
    inflections: table.inflections.map(({ tags, forms }) => ({ tags, forms })),
    periphrastic: table.periphrastic.map(({ key, rule }) => ({ key, rule })),
    ...(Object.keys(table.meta).length > 0 && { meta: table.meta }),
  };
}

export function fromStored(stored: StoredTable, lang: string): InflectionTable {
  return {
    lang,
    lemma: stored.lemma,
    title: stored.title,
    pos: stored.pos,
    inflections: stored.inflections.map((i) => ({ ...i, ipa: [] })),
    periphrastic: stored.periphrastic.map((p) => ({ ...p, label: p.key })),
    notes: [],
    meta: stored.meta ?? {},
  };
}

/**
 * A language's saved tables, loaded when first asked for: each language's
 * file is a chunk of its own, so the page only downloads the tables of the
 * languages that are opened.
 */
export interface SavedTableSource {
  /** Loads the tables, once; later calls wait for the same load. A failed load is tried again next time. */
  loadSaved(): Promise<void>;
  /** The table of a verb on the list, however it is typed (S’asseoir, Aller); undefined until loaded. */
  savedTable(verb: string): InflectionTable | undefined;
}

/** `load` gives the JSON file as text, e.g. () => import('./data/verbTables.json?raw'). */
export function savedTables(load: () => Promise<{ default: string }>, lang: string, locale: string): SavedTableSource {
  let tables: Record<string, StoredTable> | undefined;
  let loading: Promise<void> | undefined;
  return {
    loadSaved() {
      loading ??= load().then(
        (file) => {
          tables = (JSON.parse(file.default) as SavedTables).tables;
        },
        (err: unknown) => {
          loading = undefined;
          throw err;
        },
      );
      return loading;
    },
    savedTable(verb) {
      const stored = tables?.[toPageTitle(verb).toLocaleLowerCase(locale)];
      return stored && fromStored(stored, lang);
    },
  };
}
