import type { InflectionTable } from '../../../core/types';
import type { PersonalRow } from './parse';

/**
 * How the personal pronoun table is presented: singular persons, plural
 * persons, then after a rule the formal De and the old possessive of vi
 * (vor, vort, vore), then the reflexive on its own.
 *
 *   jeg  mig   min · mit · mine
 *   ...
 *   ─────
 *   vi   os    vores
 *   I    jer   jeres
 *   de   dem   deres
 *   ─────
 *   De   Dem   Deres
 *   —    —     vor · vort · vore
 *   REFLEKSIV
 *   —    sig   sin · sit · sine
 */

export interface PersonalLine {
  nominative: string | null;
  oblique: string | null;
  possessive: string[];
}

export interface PersonalLayout {
  singular: PersonalLine[];
  plural: PersonalLine[];
  /** Less common forms: the formal De, and vor/vort/vore (old or formal "our"). */
  other: PersonalLine[];
  /** sig, and the possessive used with a singular subject (sin, sit, sine). */
  reflexive: PersonalLine | null;
}

/** Rows back from the table's inflections and row metadata. */
export function personalRows(table: InflectionTable): PersonalRow[] {
  const meta = JSON.parse(table.meta.rows ?? '[]') as Pick<PersonalRow, 'number' | 'note'>[];
  const get = (i: number, part: string) =>
    table.inflections.find((inf) => inf.tags[0] === `row:${i}` && inf.tags[1] === part)?.forms ?? [];
  return meta.map((m, i) => ({
    ...m,
    nominative: get(i, 'nom')[0] ?? null,
    oblique: get(i, 'obl')[0] ?? null,
    possessive: get(i, 'poss'),
  }));
}

export function layoutPersonal(rows: PersonalRow[]): PersonalLayout {
  const line = (r: PersonalRow): PersonalLine => ({
    nominative: r.nominative,
    oblique: r.oblique,
    possessive: r.possessive,
  });
  const persons = rows.filter((r) => !r.note);
  const reflexive = rows.filter((r) => r.note === 'reflexive');
  const other = rows.filter((r) => r.note === 'formal' || r.note === 'archaic');
  return {
    singular: persons.filter((r) => r.number === 'singular').map(line),
    plural: persons.filter((r) => r.number === 'plural').map(line),
    other: other.map(line),
    // Singular and plural reflexive share "sig"; only the singular has sin/sit/sine.
    reflexive: reflexive.length
      ? {
          nominative: null,
          oblique: reflexive.find((r) => r.oblique)?.oblique ?? null,
          possessive: reflexive.find((r) => r.possessive.length)?.possessive ?? [],
        }
      : null,
  };
}
