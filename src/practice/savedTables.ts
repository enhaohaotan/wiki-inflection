import type { InflectionTable } from '../core/types';
import type { LookupResult } from '../features/lookup/lookup';
import { mainTable } from '../languages/fr/verb/layout';
import { toPageTitle } from '../wiktionary/client';
import saved from './data/verbTables.json?raw';

/**
 * Conjugation tables of the verbs on the practice list, fetched from
 * Wiktionary ahead of time by scripts/fetch-verb-tables.mjs and shipped with
 * the page, so those verbs can be practised offline. Other verbs are looked
 * up as usual.
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

/** The table a lookup result is practised with: after a reverse lookup (vais), the verb's own table. */
export function practiceTable(result: Extract<LookupResult, { status: 'ok' }>): InflectionTable | undefined {
  return result.match ? mainTable(result.entry, result.match.form) : result.entry.tables[0];
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

export function fromStored(stored: StoredTable): InflectionTable {
  return {
    lang: 'fr',
    lemma: stored.lemma,
    title: stored.title,
    pos: stored.pos,
    inflections: stored.inflections.map((i) => ({ ...i, ipa: [] })),
    periphrastic: stored.periphrastic.map((p) => ({ ...p, label: p.key })),
    notes: [],
    meta: {},
  };
}

let tables: Record<string, StoredTable> | undefined;

/** The saved table for `word` when it is a verb on the list, however it is typed (S’asseoir, Aller). */
export function savedTable(word: string): InflectionTable | undefined {
  tables ??= (JSON.parse(saved) as SavedTables).tables;
  const stored = tables[toPageTitle(word).toLocaleLowerCase('fr')];
  return stored && fromStored(stored);
}
