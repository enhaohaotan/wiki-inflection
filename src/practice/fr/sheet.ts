import type { InflectionTable } from '../../core/types';
import { layoutConjugation, pronounFor, type TenseBlock } from '../../languages/fr/verb/layout';
import { expandForm } from '../answers';
import type { Blank, Sheet, SheetSection } from '../types';

/**
 * A French conjugation as exercises, built from the same layout as the
 * conjugation viewer, so the answers are exactly what the viewer shows.
 */

export type Person = '1' | '2' | '3';
export type Num = 's' | 'p';
export type Kind = 'plain' | 'subjunctive' | 'imperative';

/** Short names in the bar of section links. */
const SHORT_NAMES: Record<string, string> = {
  indicatif: 'Ind.',
  conditionnel: 'Cond.',
  subjonctif: 'Subj.',
  imperatif: 'Impér.',
  participe: 'Part.',
};

/** Same order as the rows of the layout. */
export const ALL_PERSONS: [Person, Num][] = [
  ['1', 's'],
  ['2', 's'],
  ['3', 's'],
  ['1', 'p'],
  ['2', 'p'],
  ['3', 'p'],
];
export const IMPERATIVE_PERSONS: [Person, Num][] = [
  ['2', 's'],
  ['1', 'p'],
  ['2', 'p'],
];

export const KINDS: Record<string, Kind> = { subjonctif: 'subjunctive', imperatif: 'imperative' };

/** Tenses of written narrative only: passé simple, passé antérieur, imperfect and pluperfect subjunctive. */
const LITERARY: Record<string, string[]> = {
  indicatif: ['Passé simple', 'Passé antérieur'],
  subjonctif: ['Imparfait', 'Plus-que-parfait'],
};

/** Whether a tense starts folded on the sheet. */
export function startsFolded(moodId: string, tense: string, compound: boolean): boolean {
  return compound || (LITERARY[moodId]?.includes(tense) ?? false);
}

function blanksOf(prefix: string, tense: TenseBlock, persons: [Person, Num][], kind: Kind): Blank[] {
  return tense.rows.map((row, i) => {
    const [person, num] = persons[i]!;
    return {
      id: `${prefix}/${i}`,
      // Elided as written before the answer (j’ai, que j’aille); the plain pronoun where there is no form.
      label: row.forms.length > 0 ? row.pronoun : pronounFor(person, num, kind, undefined),
      forms: row.forms,
      accepted: [...new Set(row.forms.flatMap(expandForm))],
    };
  });
}

export function buildSheet(table: InflectionTable): Sheet {
  const c = layoutConjugation(table);
  const sections: SheetSection[] = c.moods.map((mood) => {
    const kind = KINDS[mood.id] ?? 'plain';
    const persons = kind === 'imperative' ? IMPERATIVE_PERSONS : ALL_PERSONS;
    return {
      id: mood.id,
      name: mood.fr,
      short: SHORT_NAMES[mood.id] ?? mood.fr,
      pairs: mood.pairs.map((pair) =>
        [pair.simple, pair.compound]
          .filter((t): t is TenseBlock => t !== undefined)
          .map((t) => ({
            name: t.fr,
            compound: t.compound,
            folded: startsFolded(mood.id, t.fr, t.compound),
            blanks: blanksOf(`${mood.id}/${t.fr}`, t, persons, kind),
          })),
      ),
    };
  });

  if (c.participles.length > 0) {
    sections.push({
      id: 'participe',
      name: 'Participe',
      short: SHORT_NAMES.participe!,
      pairs: [
        [
          {
            name: 'Participe',
            compound: false,
            folded: false,
            blanks: c.participles.map((p) => ({
              id: `participe/${p.fr}`,
              label: p.fr.toLowerCase(),
              forms: p.forms,
              // The agreed forms (allée, allés, allées) are right too.
              accepted: [...new Set([...p.forms, ...p.agreed].flatMap(expandForm))],
            })),
          },
        ],
      ],
    });
  }

  return { lemma: c.lemma, pos: table.pos, sections };
}
