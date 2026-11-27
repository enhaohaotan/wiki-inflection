import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { InflectionTable, LanguageEntry } from '../core/types';
import { findLanguageSection, parsePage } from '../wiktionary/page';
import type { ConjugationLayout, ConjugationRow } from './conjugation';
import type { LanguageModule } from './registry';

/**
 * For tests only: Wiktionary pages saved in test/fixtures/<code> from the
 * Core REST API (/w/rest.php/v1/page/{title}/html), read the way the site
 * reads them, and a look into a layout.
 */

/** The language's section of a saved page, or null if there is no such page. */
export function fixtureSection(language: LanguageModule, page: string): Element | null {
  const path = resolve(process.cwd(), 'test/fixtures', language.code, `${page}.html`);
  if (!existsSync(path)) return null;
  return findLanguageSection(parsePage(readFileSync(path, 'utf8')), language.heading);
}

/** The tables on a saved page, as the language parses them. */
export function fixtureTables(language: LanguageModule, word: string): InflectionTable[] {
  const section = fixtureSection(language, word);
  if (!section) throw new Error(`no ${language.name} section in ${word}`);
  return language.parse(section, word).tables;
}

/** The table of `lemma` on the page `word`, or its first table. */
export function fixtureLoader(language: LanguageModule): (word: string, lemma?: string) => InflectionTable {
  return (word, lemma = word) => {
    const tables = fixtureTables(language, word);
    return tables.find((t) => t.lemma === lemma) ?? tables[0]!;
  };
}

/**
 * A saved page's entry with the language's second step too, which reads
 * other saved pages: French participles from "pp-<participle>".
 */
export async function fixtureEntry(language: LanguageModule, word: string): Promise<LanguageEntry> {
  const entry = language.parse(fixtureSection(language, word)!, word);
  if (!language.enrich) return entry;
  return language.enrich(entry, async (title) => fixtureSection(language, `pp-${title}`), async () => null);
}

/** The rows of one tense in a layout. */
export function tenseIn(layout: ConjugationLayout, mood: string, name: string): ConjugationRow[] {
  const tense = layout.moods
    .find((m) => m.id === mood)
    ?.pairs.flat()
    .find((t) => t.name === name);
  if (!tense) throw new Error(`no ${mood} ${name}`);
  return tense.rows;
}
