import type { InflectionTable } from '../../../core/types';
import type { ConjugationLayout, ConjugationMood, ConjugationRow } from '../../conjugation';
import { layoutConjugation, pronounFor, type TenseBlock } from './layout';
import { expandForm } from './notation';

/**
 * A French conjugation in the layout shared by every language, built from
 * the conjugation viewer's own layout, so that what the practice page asks
 * is exactly what the viewer shows.
 */

type Person = '1' | '2' | '3';
type Num = 's' | 'p';
type Kind = 'plain' | 'subjunctive' | 'imperative';

/** Short names in the bar of section links. */
const SHORT_NAMES: Record<string, string> = {
  indicatif: 'Ind.',
  conditionnel: 'Cond.',
  subjonctif: 'Subj.',
  imperatif: 'Impér.',
  participe: 'Part.',
};

/** Same order as the rows of the viewer's layout. */
const ALL_PERSONS: [Person, Num][] = [
  ['1', 's'],
  ['2', 's'],
  ['3', 's'],
  ['1', 'p'],
  ['2', 'p'],
  ['3', 'p'],
];
const IMPERATIVE_PERSONS: [Person, Num][] = [
  ['2', 's'],
  ['1', 'p'],
  ['2', 'p'],
];

const KINDS: Record<string, Kind> = { subjonctif: 'subjunctive', imperatif: 'imperative' };

/** Tenses of written narrative only: passé simple, passé antérieur, imperfect and pluperfect subjunctive. */
const LITERARY: Record<string, string[]> = {
  indicatif: ['Passé simple', 'Passé antérieur'],
  subjonctif: ['Imparfait', 'Plus-que-parfait'],
};

/** Whether a tense starts folded. */
export function startsFolded(moodId: string, tense: string, compound: boolean): boolean {
  return compound || (LITERARY[moodId]?.includes(tense) ?? false);
}

function rowsOf(tense: TenseBlock, persons: [Person, Num][], kind: Kind): ConjugationRow[] {
  return tense.rows.map((row, i) => {
    const [person, num] = persons[i]!;
    return {
      // Elided as written before the answer (j’ai, que j’aille); the plain pronoun where there is no form.
      label: row.forms.length > 0 ? row.pronoun : pronounFor(person, num, kind, undefined),
      shown: row.forms,
      accepted: [...new Set(row.forms.flatMap(expandForm))],
    };
  });
}

export function conjugationLayout(table: InflectionTable): ConjugationLayout {
  const c = layoutConjugation(table);
  const moods: ConjugationMood[] = c.moods.map((mood) => {
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
            rows: rowsOf(t, persons, kind),
          })),
      ),
    };
  });

  if (c.participles.length > 0) {
    moods.push({
      id: 'participe',
      name: 'Participe',
      short: SHORT_NAMES.participe!,
      pairs: [
        [
          {
            name: 'Participe',
            compound: false,
            folded: false,
            rows: c.participles.map((p) => ({
              label: p.fr.toLowerCase(),
              shown: p.forms,
              // The agreed forms (allée, allés, allées) are right too.
              accepted: [...new Set([...p.forms, ...p.agreed].flatMap(expandForm))],
            })),
          },
        ],
      ],
    });
  }

  return { lemma: c.lemma, pos: table.pos, moods };
}
