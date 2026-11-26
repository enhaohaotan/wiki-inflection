import type { InflectionTable } from '../../core/types';
import type { Blank, Exercise, Sheet, SheetSection } from '../types';
import { USUAL_AUXILIARY } from './auxiliaries';
import { isReflexive, REFLEXIVE_PRONOUNS } from './reflexive';

/**
 * A German conjugation as exercises. The simple tenses come from the table;
 * the compound ones are built here: haben or sein and the past participle
 * (habe gemacht, bin gefahren), werden and the infinitive (werde machen,
 * würde machen), with the reflexive pronoun after the first verb (habe mich
 * gefreut).
 */

type Person = [person: string, num: string];

const PERSONS: Person[] = [
  ['1', 's'],
  ['2', 's'],
  ['3', 's'],
  ['1', 'p'],
  ['2', 'p'],
  ['3', 'p'],
];

const SUBJECTS: Record<string, string> = {
  '1s': 'ich',
  '2s': 'du',
  '3s': 'er/sie/es',
  '1p': 'wir',
  '2p': 'ihr',
  '3p': 'sie/Sie',
};

/** The helping verbs' forms, ich to sie, by the tags of the tense. */
const HABEN: Record<string, string[]> = {
  pres: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
  pret: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'],
  'sub:I': ['habe', 'habest', 'habe', 'haben', 'habet', 'haben'],
  'sub:II': ['hätte', 'hättest', 'hätte', 'hätten', 'hättet', 'hätten'],
};
const SEIN: Record<string, string[]> = {
  pres: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
  pret: ['war', 'warst', 'war', 'waren', 'wart', 'waren'],
  'sub:I': ['sei', 'seist', 'sei', 'seien', 'seiet', 'seien'],
  'sub:II': ['wäre', 'wärst', 'wäre', 'wären', 'wärt', 'wären'],
};
const WERDEN: Record<string, string[]> = {
  pres: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
  'sub:I': ['werde', 'werdest', 'werde', 'werden', 'werdet', 'werden'],
  'sub:II': ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden'],
};
const AUXILIARIES: Record<string, Record<string, string[]>> = { haben: HABEN, sein: SEIN };

/** How a tense is made: read from the table, or built. */
type Build =
  | { kind: 'simple'; tags: string }
  /** haben/sein in `tense` + participle: Perfekt, Plusquamperfekt. */
  | { kind: 'perfect'; tense: string }
  /** werden in `tense` + infinitive: Futur I, würde-Form. */
  | { kind: 'future'; tense: string }
  /** werden in `tense` + participle + haben/sein: Futur II. */
  | { kind: 'future perfect'; tense: string };

interface TenseSpec {
  name: string;
  build: Build;
  folded: boolean;
}

interface MoodSpec {
  id: string;
  name: string;
  short: string;
  pairs: TenseSpec[][];
}

const simple = (name: string, tags: string, folded = false): TenseSpec => ({
  name,
  build: { kind: 'simple', tags },
  folded,
});
const built = (name: string, build: Build): TenseSpec => ({ name, build, folded: true });

/**
 * The compound tenses start folded, as in the other languages, and so does
 * the whole Konjunktiv I, which is used in reported speech in writing.
 */
const MOODS: MoodSpec[] = [
  {
    id: 'indikativ',
    name: 'Indikativ',
    short: 'Ind.',
    pairs: [
      [simple('Präsens', 'pres'), built('Perfekt', { kind: 'perfect', tense: 'pres' })],
      [simple('Präteritum', 'pret'), built('Plusquamperfekt', { kind: 'perfect', tense: 'pret' })],
      [built('Futur I', { kind: 'future', tense: 'pres' }), built('Futur II', { kind: 'future perfect', tense: 'pres' })],
    ],
  },
  {
    id: 'konjunktiv-1',
    name: 'Konjunktiv I',
    short: 'Konj. I',
    pairs: [
      [simple('Präsens', 'sub:I', true), built('Perfekt', { kind: 'perfect', tense: 'sub:I' })],
      [built('Futur I', { kind: 'future', tense: 'sub:I' })],
    ],
  },
  {
    id: 'konjunktiv-2',
    name: 'Konjunktiv II',
    short: 'Konj. II',
    pairs: [
      [simple('Präteritum', 'sub:II'), built('Plusquamperfekt', { kind: 'perfect', tense: 'sub:II' })],
      [built('würde + Infinitiv', { kind: 'future', tense: 'sub:II' })],
    ],
  },
];

function formsOf(table: InflectionTable, tags: string): string[] {
  return table.inflections.find((i) => i.tags.join('|') === tags)?.forms ?? [];
}

interface Verb {
  table: InflectionTable;
  /** The infinitive without sich: freuen, anfangen. */
  infinitive: string;
  participle: string | undefined;
  /** haben or sein; both only where nothing says which is usual. Shown as the answer. */
  auxiliaries: string[];
  /**
   * Accepted, not shown: one used only in some regions or registers
   * (anfangen: bin angefangen), or the less usual of two (fahren: habe gefahren).
   */
  rareAuxiliaries: string[];
  reflexive: boolean;
}

function verbOf(table: InflectionTable): Verb {
  let auxiliaries = formsOf(table, 'aux').filter((a) => a in AUXILIARIES);
  let rareAuxiliaries = formsOf(table, 'aux|rare').filter((a) => a in AUXILIARIES);
  // Of two, the one a learner meets most is shown; the other is accepted.
  const usual = USUAL_AUXILIARY[table.lemma];
  if (usual && auxiliaries.length > 1 && auxiliaries.includes(usual)) {
    rareAuxiliaries = [...auxiliaries.filter((a) => a !== usual), ...rareAuxiliaries];
    auxiliaries = [usual];
  }
  return {
    table,
    infinitive: formsOf(table, 'inf')[0] ?? table.lemma,
    participle: formsOf(table, 'past|part')[0],
    auxiliaries: auxiliaries.length > 0 ? auxiliaries : ['haben'],
    rareAuxiliaries,
    reflexive: isReflexive(table.lemma),
  };
}

/**
 * The forms of a built tense for person `i`: shown (with each usual
 * auxiliary) and accepted (with a rare one too).
 */
function builtForms(verb: Verb, build: Exclude<Build, { kind: 'simple' }>, i: number): [string[], string[]] {
  const key = PERSONS[i]!.join('');
  const pronoun = verb.reflexive ? ` ${REFLEXIVE_PRONOUNS[key]}` : '';
  if (build.kind === 'future') {
    const form = `${WERDEN[build.tense]![i]}${pronoun} ${verb.infinitive}`;
    return [[form], [form]];
  }
  if (!verb.participle) return [[], []];
  const form = (auxiliary: string) =>
    build.kind === 'perfect'
      ? `${AUXILIARIES[auxiliary]![build.tense]![i]}${pronoun} ${verb.participle}`
      : `${WERDEN[build.tense]![i]}${pronoun} ${verb.participle} ${auxiliary}`;
  const shown = verb.auxiliaries.map(form);
  return [shown, [...shown, ...verb.rareAuxiliaries.map(form)]];
}

function blanks(verb: Verb, mood: MoodSpec, tense: TenseSpec): Blank[] {
  return PERSONS.map((person, i) => {
    const id = `${mood.id}/${tense.name}/${i}`;
    const label = SUBJECTS[person.join('')]!;
    // No form where the verb has none in the present (regnen: only "regnet").
    const exists = formsOf(verb.table, `${person.join('|')}|pres`).length > 0;
    if (!exists) return { id, label, forms: [], accepted: [] };
    if (tense.build.kind === 'simple') {
      const forms = formsOf(verb.table, `${person.join('|')}|${tense.build.tags}`);
      return { id, label, forms, accepted: forms };
    }
    const [forms, accepted] = builtForms(verb, tense.build, i);
    return { id, label, forms, accepted };
  });
}

export function buildSheet(table: InflectionTable): Sheet {
  const verb = verbOf(table);
  const sections: SheetSection[] = MOODS.map((mood) => ({
    id: mood.id,
    name: mood.name,
    short: mood.short,
    pairs: mood.pairs.map((pair) =>
      pair.map(
        (tense): Exercise => ({
          name: tense.name,
          compound: tense.build.kind !== 'simple',
          folded: tense.folded,
          blanks: blanks(verb, mood, tense),
        }),
      ),
    ),
  }));

  const imperative = (tags: string, label: string): Blank => {
    const forms = formsOf(table, tags);
    return { id: `imperativ/${label}`, label, forms, accepted: forms };
  };
  sections.push({
    id: 'imperativ',
    name: 'Imperativ',
    short: 'Imp.',
    pairs: [
      [
        {
          name: 'Imperativ',
          compound: false,
          folded: false,
          blanks: [imperative('s|imp', '(du)'), imperative('p|imp', '(ihr)')],
        },
      ],
    ],
  });

  const participle = (tags: string, label: string): Blank => {
    const forms = formsOf(table, tags).slice(0, 1);
    return { id: `partizip/${label}`, label, forms, accepted: formsOf(table, tags) };
  };
  sections.push({
    id: 'partizip',
    name: 'Partizip',
    short: 'Part.',
    pairs: [
      [
        {
          name: 'Partizip',
          compound: false,
          folded: false,
          blanks: [participle('pres|part', 'Partizip I'), participle('past|part', 'Partizip II')],
        },
      ],
    ],
  });

  return { lemma: table.lemma, pos: table.pos, sections };
}
