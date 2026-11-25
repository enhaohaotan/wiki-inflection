import type { InflectionTable, LanguageEntry } from '../../../core/types';

/**
 * How a Danish conjugation is presented. Danish verbs don't change for
 * person, so it is three short lists:
 *
 *   (untitled)   Infinitiv spise, Præsens spiser, Præteritum spiste,
 *                Perfektum spist, Imperativ spis  (the order learners recite)
 *   PASSIV       Infinitiv spises, Præsens spises, Præteritum spistes
 *   PARTICIPIUM  Præsens spisende
 *
 * Labels are the Danish grammar terms.
 */

export interface DanishRow {
  label: string;
  forms: string[];
}

export interface DanishSection {
  /** None for the basic forms, which head the page. */
  title?: string;
  rows: DanishRow[];
}

export interface DanishConjugation {
  lemma: string;
  sections: DanishSection[];
}

function formsWith(table: InflectionTable, tags: string[]): string[] {
  return table.inflections
    .filter((i) => i.tags.length === tags.length && tags.every((t) => i.tags.includes(t)))
    .flatMap((i) => i.forms);
}

export function layoutDanishVerb(table: InflectionTable): DanishConjugation {
  const row = (label: string, tags: string[]): DanishRow => ({ label, forms: formsWith(table, tags) });
  const sections: DanishSection[] = [
    {
      // The basic forms. Not titled "Aktiv": spist is also used in the passive.
      rows: [
        row('Infinitiv', ['inf', 'act']),
        row('Præsens', ['pres', 'act']),
        row('Præteritum', ['past', 'act']),
        row('Perfektum', ['past', 'part']),
        row('Imperativ', ['imp', 'act']),
      ],
    },
    {
      title: 'Passiv',
      rows: [
        row('Infinitiv', ['inf', 'pass']),
        row('Præsens', ['pres', 'pass']),
        row('Præteritum', ['past', 'pass']),
      ],
    },
    { title: 'Participium', rows: [row('Præsens', ['pres', 'part'])] },
  ];
  return {
    lemma: table.lemma,
    // A section with no forms at all (synes has no passive) is left out.
    sections: sections.filter((s) => s.rows.some((r) => r.forms.length > 0)),
  };
}

export function matchesDanishForm(form: string, query: string): boolean {
  const norm = (s: string) => s.normalize('NFC').trim().toLocaleLowerCase('da');
  return norm(form) === norm(query);
}

export function danishTablesWithMatch(tables: InflectionTable[], query: string | undefined): boolean[] {
  return tables.map(
    (t) => !!query && t.inflections.some((i) => i.forms.some((f) => matchesDanishForm(f, query))),
  );
}

/**
 * The tables that stand for an entry after a reverse lookup: every table
 * containing the form (spiser is both the noun's plural and the verb's
 * present), else the first table.
 */
export function danishMainTables(entry: LanguageEntry, query: string): InflectionTable[] {
  const hits = danishTablesWithMatch(entry.tables, query);
  const matching = entry.tables.filter((_, i) => hits[i]);
  return matching.length > 0 ? matching : entry.tables.slice(0, 1);
}
