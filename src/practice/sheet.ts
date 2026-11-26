import type { InflectionTable } from '../core/types';
import { layoutConjugation, pronounFor, type TenseBlock } from '../languages/fr/verb/layout';

/**
 * A conjugation turned into fill-in-the-blank exercises: one blank per
 * person of every tense, built from the same layout as the conjugation
 * viewer, so the answers are exactly what the viewer shows.
 */

export interface Blank {
  /** Stable within a sheet, e.g. "indicatif/Passé composé/0". */
  id: string;
  /** Shown before the blank: the subject (je, que tu, (nous)) or the participle's name. */
  label: string;
  /** The answer as the viewer writes it, e.g. ["suis allé(e)"]; [] when the verb has no form here. */
  forms: string[];
  /** Every spelling accepted as correct, e.g. "suis allé" and "suis allée". */
  accepted: string[];
}

export interface Exercise {
  /** Tense name in French, e.g. "Passé composé". */
  fr: string;
  /** Built from an auxiliary and the past participle. */
  compound: boolean;
  /**
   * Shown folded at first: compound tenses (mostly the auxiliary again) and
   * the literary tenses, which everyday French doesn't use.
   */
  folded: boolean;
  blanks: Blank[];
}

export interface SheetSection {
  id: string;
  /** Mood name, e.g. "Indicatif". */
  fr: string;
  /** A simple tense and the compound tense built on it, shown side by side. */
  pairs: Exercise[][];
}

export interface Sheet {
  lemma: string;
  pos: string;
  sections: SheetSection[];
}

export type Person = '1' | '2' | '3';
export type Num = 's' | 'p';
export type Kind = 'plain' | 'subjunctive' | 'imperative';

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

/** For comparing answers: case, apostrophes and spacing don't count; accents do. */
export function normalizeAnswer(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[’ʼ‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('fr');
}

/** "allé(e)s" -> allés, allées; "allé(e)(s)" -> allé, allée, allés, allées. */
function expandOptional(text: string): string[] {
  const m = text.match(/\(([^()]*)\)/);
  if (!m) return [text];
  const before = text.slice(0, m.index);
  const after = text.slice(m.index! + m[0].length);
  return [...expandOptional(before + after), ...expandOptional(before + m[1] + after)];
}

/**
 * Every spelling a form written in the viewer's notation stands for.
 * Agreement written as alternatives ("me suis dissous / dissoute") repeats
 * the leading words for the shorter alternative.
 */
export function expandForm(form: string): string[] {
  const alternatives = form.split(' / ');
  const firstWords = alternatives[0]!.split(' ');
  const full = alternatives.map((alt, i) => {
    const words = alt.split(' ');
    if (i === 0 || words.length >= firstWords.length) return alt;
    return [...firstWords.slice(0, firstWords.length - words.length), ...words].join(' ');
  });
  return [...new Set(full.flatMap(expandOptional))];
}

/** Whether `answer` is one of the accepted spellings. */
export function isCorrect(answer: string, blank: Blank): boolean {
  const a = normalizeAnswer(answer);
  return blank.accepted.some((form) => normalizeAnswer(form) === a);
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
      fr: mood.fr,
      pairs: mood.pairs.map((pair) =>
        [pair.simple, pair.compound]
          .filter((t): t is TenseBlock => t !== undefined)
          .map((t) => ({
            fr: t.fr,
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
      fr: 'Participe',
      pairs: [
        [
          {
            fr: 'Participe',
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
