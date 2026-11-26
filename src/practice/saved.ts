import type { InflectionTable } from '../core/types';
import { toPageTitle } from '../wiktionary/client';

/**
 * Conjugation tables of the verbs on a language's practice list, fetched
 * from Wiktionary ahead of time by scripts/fetch-verb-tables.mjs and shipped
 * with the page (src/practice/<code>/data/verbTables.json), so those verbs
 * can be practised offline. Other verbs are looked up as usual.
 */

/** What is kept of a table: only what the practice sheet uses. */
export interface StoredTable {
  lemma: string;
  title: string;
  pos: string;
  inflections: { tags: string[]; forms: string[] }[];
  periphrastic: { key: string; rule: string }[];
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
    meta: {},
  };
}

/**
 * Reads a language's saved tables (the JSON file as text) and returns a
 * function giving the table of a verb on the list, however it is typed
 * (S’asseoir, Aller). The file is parsed the first time it is needed.
 */
export function savedTables(raw: string, lang: string, locale: string): (verb: string) => InflectionTable | undefined {
  let tables: Record<string, StoredTable> | undefined;
  return (verb) => {
    tables ??= (JSON.parse(raw) as SavedTables).tables;
    const stored = tables[toPageTitle(verb).toLocaleLowerCase(locale)];
    return stored && fromStored(stored, lang);
  };
}
