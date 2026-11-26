import type { Inflection, InflectionTable } from '../core/types';
import { cleanText, formOfTargets } from '../wiktionary/page';
import type { LanguageModule } from './registry';

/**
 * What the verb parsers of the practice-only languages (German, Spanish,
 * Italian) share: reading cells, the class Wiktionary gives a verb, and the
 * table and language module they return. Each language keeps only how its
 * own table is laid out.
 */

/** Person and number, in table order: 1s 2s 3s 1p 2p 3p. */
export type Person = readonly [person: string, num: string];

export const PERSONS: readonly Person[] = [
  ['1', 's'],
  ['2', 's'],
  ['3', 's'],
  ['1', 'p'],
  ['2', 'p'],
  ['3', 'p'],
];

/** A cell's text without its footnote marks (sein¹ -> sein). */
export function textWithoutNotes(cell: Element): string {
  const clone = cell.cloneNode(true) as Element;
  clone.querySelectorAll('sup').forEach((el) => el.remove());
  return cleanText(clone);
}

/** A header cell's text, lowercased, to look up a row: "Past historic" -> "past historic". */
export function label(cell: Element): string {
  return textWithoutNotes(cell).toLowerCase();
}

/**
 * The class Wiktionary gives a verb in its table's heading, without the
 * auxiliary: "Conjugation of finìre (-ire; irregular) (See Appendix:...)" ->
 * "-ire; irregular"; "Conjugation of anfangen (class 7 strong, auxiliary
 * haben or sein)" -> "class 7 strong". Empty when there is none (hablar).
 */
export function verbClass(heading: string): string {
  const note = /Conjugation of [^(]*\(((?!See )[^)]*)\)/.exec(heading)?.[1] ?? '';
  return note
    .split(/,\s*/)
    .filter((part) => !part.startsWith('auxiliary'))
    .join(', ');
}

/**
 * A verb table from its forms, or null if it has no infinitive or present
 * (a table of something else). The page it was read from and the verb's
 * class go into meta, which the practice page uses for the credit and for
 * how often Random picks the verb.
 */
export function verbTable(
  lang: string,
  inflections: Inflection[],
  page: string,
  heading: string,
  hasPresent: (inflection: Inflection) => boolean,
): InflectionTable | null {
  const lemma = inflections.find((i) => i.tags.join('|') === 'inf')?.forms[0];
  if (!lemma || !inflections.some(hasPresent)) return null;
  const meta: Record<string, string> = { page };
  const note = verbClass(heading);
  if (note) meta.class = note;
  return {
    lang,
    pos: 'verb',
    lemma,
    title: `Conjugation of ${lemma}`,
    inflections,
    periphrastic: [],
    notes: [],
    meta,
  };
}

/**
 * A language module for verbs only, for the practice page: the lookup site
 * has no view for it (it is not in the registry's list of languages).
 * Reverse lookup follows a form's "inflection of" links (parlo -> parlare).
 */
export function verbModule(
  code: string,
  name: string,
  parseTables: (section: Element, pageTitle: string) => InflectionTable[],
): LanguageModule {
  return {
    code,
    name,
    locale: code,
    heading: name,
    parse(section, pageTitle) {
      return { lang: code, title: pageTitle, tables: parseTables(section, pageTitle) };
    },
    lemmasOf(section) {
      return formOfTargets(section, code, (heading) => /^Verb\b/.test(heading));
    },
  };
}
