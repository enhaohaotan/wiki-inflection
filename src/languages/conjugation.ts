import type { InflectionTable } from '../core/types';
import type { Person } from './verbTables';

/**
 * A verb's conjugation laid out the same way for every language: moods, in
 * each the tenses side by side in pairs (a simple tense and the compound
 * tense built on it), in each a row per person, then single forms such as
 * the participles. Each language turns its table into this layout (see
 * <code>/verb/layout.ts or, for French, verb/conjugation.ts); the practice
 * page turns any layout into exercises, and lookup views can show it.
 */

export interface ConjugationRow {
  /** Before the form: "io", "che io", "(tu)", "participio passato". */
  label: string;
  /** The answer as written: "sono andato/a"; [] where the verb has no form. */
  shown: string[];
  /** Every spelling that is right: "sono andato", "sono andata". */
  accepted: string[];
}

export interface ConjugationTense {
  name: string;
  /** Built from a helping verb, not read from the table. */
  compound: boolean;
  /** Shown folded at first: compound tenses, and literary or rare ones. */
  folded: boolean;
  rows: ConjugationRow[];
}

export interface ConjugationMood {
  id: string;
  name: string;
  /** In the bar of section links: "Ind.". */
  short: string;
  pairs: ConjugationTense[][];
}

export interface ConjugationLayout {
  lemma: string;
  pos: string;
  moods: ConjugationMood[];
}

/** The forms of a slot, by its tags joined with "|": "1|s|pres|ind". */
export function formsOf(table: InflectionTable, tags: string): string[] {
  return table.inflections.find((i) => i.tags.join('|') === tags)?.forms ?? [];
}

/** A tense whose rows come from a function of the person: the way most tenses are laid out. */
export interface TenseSpec {
  name: string;
  compound: boolean;
  folded: boolean;
  answer(person: Person, index: number): { shown: string[]; accepted: string[] };
}

/** A mood laid out person by person. */
export interface MoodSpec {
  id: string;
  name: string;
  short: string;
  persons: readonly Person[];
  /** "io", "che io", "(tu)". */
  subject(person: Person): string;
  pairs: TenseSpec[][];
}

export function moodOf(mood: MoodSpec): ConjugationMood {
  return {
    id: mood.id,
    name: mood.name,
    short: mood.short,
    pairs: mood.pairs.map((pair) =>
      pair.map((tense) => ({
        name: tense.name,
        compound: tense.compound,
        folded: tense.folded,
        rows: mood.persons.map((person, i) => ({ label: mood.subject(person), ...tense.answer(person, i) })),
      })),
    ),
  };
}

/** A section of single forms (participles, gerund), as one tense. */
export function formsMood(id: string, name: string, short: string, tense: string, rows: ConjugationRow[]): ConjugationMood {
  return { id, name, short, pairs: [[{ name: tense, compound: false, folded: false, rows }]] };
}
