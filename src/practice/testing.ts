import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { InflectionTable } from '../core/types';
import type { ConjugationLayout } from '../languages/conjugation';
import { findLanguageSection, parsePage } from '../wiktionary/page';
import { buildSheet } from './sheet';
import type { Blank, Sheet } from './types';

/** For tests only: reading saved Wiktionary pages and looking into sheets. */

/**
 * A language's loader for the pages saved in test/fixtures/<code> from the
 * Core REST API (/w/rest.php/v1/page/{title}/html): the table of `lemma`
 * on the page `word`, or its first table.
 */
export function fixtureLoader(
  code: string,
  heading: string,
  parse: (section: Element, pageTitle: string) => InflectionTable[],
): (word: string, lemma?: string) => InflectionTable {
  return (word, lemma = word) => {
    const html = readFileSync(resolve(process.cwd(), 'test/fixtures', code, `${word}.html`), 'utf8');
    const tables = parse(findLanguageSection(parsePage(html), heading)!, word);
    return tables.find((t) => t.lemma === lemma) ?? tables[0]!;
  };
}

/** A table's sheet, laid out by a language's layout. */
export function sheetBuilder(layout: (table: InflectionTable) => ConjugationLayout): (table: InflectionTable) => Sheet {
  return (table) => buildSheet(layout(table));
}

/** The blanks of one tense on a sheet. */
export function tense(sheet: Sheet, mood: string, name: string): Blank[] {
  const section = sheet.sections.find((s) => s.id === mood)!;
  return section.pairs.flat().find((e) => e.name === name)!.blanks;
}
