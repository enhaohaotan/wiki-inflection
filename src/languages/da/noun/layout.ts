import type { InflectionTable } from '../../../core/types';

/**
 * How a Danish noun is presented: rows for number, columns for
 * definiteness, the same orientation as the adjectives (UBESTEMT | BESTEMT).
 * The indefinite singular carries its article so the gender shows (en bil,
 * et hus). The genitive is left out: it is always the form plus -s (or '
 * after s/x/z). Labels are the Danish grammar terms.
 *
 *            UBESTEMT   BESTEMT
 *   Ental    et hus     huset
 *   Flertal  huse       husene
 */

export interface NounRow {
  label: string;
  indefinite: string[];
  definite: string[];
}

export interface DanishNoun {
  lemma: string;
  /** "en" (common gender) or "et" (neuter), shown before the indefinite singular. */
  article?: string;
  /** Ental, and Flertal unless the noun has no plural (kaffe). */
  rows: NounRow[];
}

const ARTICLES: Record<string, string> = { common: 'en', neuter: 'et' };

function formsWith(table: InflectionTable, tags: string[]): string[] {
  return table.inflections
    .filter((i) => i.tags.length === tags.length && tags.every((t) => i.tags.includes(t)))
    .flatMap((i) => i.forms);
}

export function layoutDanishNoun(table: InflectionTable): DanishNoun {
  const rows: NounRow[] = [
    {
      label: 'Ental',
      indefinite: formsWith(table, ['indef', 'nom', 's']),
      definite: formsWith(table, ['def', 'nom', 's']),
    },
    {
      label: 'Flertal',
      indefinite: formsWith(table, ['indef', 'nom', 'p']),
      definite: formsWith(table, ['def', 'nom', 'p']),
    },
  ];
  return {
    lemma: table.lemma,
    article: ARTICLES[table.meta.gender ?? ''],
    rows: rows.filter((r) => r.indefinite.length > 0 || r.definite.length > 0),
  };
}
