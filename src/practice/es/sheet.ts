import type { InflectionTable } from '../../core/types';
import type { Blank, Exercise, Sheet, SheetSection } from '../types';
import { isReflexive } from './reflexive';

/**
 * A Spanish conjugation as exercises. The simple tenses come from the
 * table; the compound tenses, which Wiktionary leaves out, are built here
 * from haber and the past participle (he hablado), with the reflexive
 * pronoun first for a reflexive verb (me he llamado).
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
/** tú, usted, nosotros, vosotros, ustedes: the formal ones are used every day. */
const IMPERATIVE_PERSONS: Person[] = [
  ['2', 's'],
  ['3', 's'],
  ['1', 'p'],
  ['2', 'p'],
  ['3', 'p'],
];

const SUBJECTS: Record<string, string> = {
  '1s': 'yo',
  '2s': 'tú',
  '3s': 'él/ella',
  '1p': 'nosotros',
  '2p': 'vosotros',
  '3p': 'ellos/ellas',
};
const IMPERATIVE_SUBJECTS: Record<string, string> = {
  '2s': 'tú',
  '3s': 'usted',
  '1p': 'nosotros',
  '2p': 'vosotros',
  '3p': 'ustedes',
};
const REFLEXIVE_PRONOUNS = ['me', 'te', 'se', 'nos', 'os', 'se'];

type Kind = 'plain' | 'subjunctive' | 'imperative';

function subject([person, num]: Person, kind: Kind): string {
  if (kind === 'imperative') return `(${IMPERATIVE_SUBJECTS[person + num]})`;
  const base = SUBJECTS[person + num]!;
  return kind === 'subjunctive' ? `que ${base}` : base;
}

/** haber's forms for each simple tense, yo to ellos. */
const HABER: Record<string, string[]> = {
  'pres|ind': ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
  'impf|ind': ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían'],
  pret: ['hube', 'hubiste', 'hubo', 'hubimos', 'hubisteis', 'hubieron'],
  'fut|ind': ['habré', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán'],
  cond: ['habría', 'habrías', 'habría', 'habríamos', 'habríais', 'habrían'],
  'pres|sub': ['haya', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
  'impf|sub|ra': ['hubiera', 'hubieras', 'hubiera', 'hubiéramos', 'hubierais', 'hubieran'],
  'impf|sub|se': ['hubiese', 'hubieses', 'hubiese', 'hubiésemos', 'hubieseis', 'hubiesen'],
  'fut|sub': ['hubiere', 'hubieres', 'hubiere', 'hubiéremos', 'hubiereis', 'hubieren'],
};

interface TenseSpec {
  /**
   * Tags of the simple tense, also the key of haber's forms. Two for the
   * imperfect subjunctive, whose -ra and -se forms are both right.
   */
  tags: string[];
  name: string;
  /** The compound tense built on it, if any. */
  compound?: string;
  folded?: boolean;
}

interface MoodSpec {
  id: string;
  name: string;
  short: string;
  kind: Kind;
  tenses: TenseSpec[];
}

/**
 * Folded at first, besides the compound tenses: the future subjunctive,
 * found only in old texts and legal language.
 */
const MOODS: MoodSpec[] = [
  {
    id: 'indicativo',
    name: 'Indicativo',
    short: 'Ind.',
    kind: 'plain',
    tenses: [
      { tags: ['pres|ind'], name: 'Presente', compound: 'Pretérito perfecto' },
      { tags: ['impf|ind'], name: 'Pretérito imperfecto', compound: 'Pretérito pluscuamperfecto' },
      { tags: ['pret'], name: 'Pretérito indefinido', compound: 'Pretérito anterior' },
      { tags: ['fut|ind'], name: 'Futuro', compound: 'Futuro perfecto' },
    ],
  },
  {
    id: 'condicional',
    name: 'Condicional',
    short: 'Cond.',
    kind: 'plain',
    tenses: [{ tags: ['cond'], name: 'Condicional simple', compound: 'Condicional compuesto' }],
  },
  {
    id: 'subjuntivo',
    name: 'Subjuntivo',
    short: 'Subj.',
    kind: 'subjunctive',
    tenses: [
      { tags: ['pres|sub'], name: 'Presente', compound: 'Pretérito perfecto' },
      { tags: ['impf|sub|ra', 'impf|sub|se'], name: 'Pretérito imperfecto', compound: 'Pretérito pluscuamperfecto' },
      { tags: ['fut|sub'], name: 'Futuro', compound: 'Futuro perfecto', folded: true },
    ],
  },
  {
    id: 'imperativo',
    name: 'Imperativo',
    short: 'Imp.',
    kind: 'imperative',
    tenses: [{ tags: ['imp'], name: 'Afirmativo' }],
  },
];

function formsOf(table: InflectionTable, tags: string): string[] {
  return table.inflections.find((i) => i.tags.join('|') === tags)?.forms ?? [];
}

function simpleBlanks(table: InflectionTable, mood: MoodSpec, tense: TenseSpec): Blank[] {
  const persons = mood.kind === 'imperative' ? IMPERATIVE_PERSONS : PERSONS;
  return persons.map((person, i) => {
    const forms = [...new Set(tense.tags.flatMap((tags) => formsOf(table, `${person.join('|')}|${tags}`)))];
    return { id: `${mood.id}/${tense.name}/${i}`, label: subject(person, mood.kind), forms, accepted: forms };
  });
}

function compoundBlanks(table: InflectionTable, mood: MoodSpec, tense: TenseSpec, name: string): Blank[] {
  const participle = formsOf(table, 'pp|m|s')[0];
  const pronouns = isReflexive(table.lemma) ? REFLEXIVE_PRONOUNS.map((p) => `${p} `) : PERSONS.map(() => '');
  return PERSONS.map((person, i) => {
    // No compound form where the verb has no simple one (llover: only "llueve").
    const exists = participle && formsOf(table, `${person.join('|')}|${tense.tags[0]}`).length > 0;
    const forms = exists ? tense.tags.map((tags) => `${pronouns[i]}${HABER[tags]![i]} ${participle}`) : [];
    return { id: `${mood.id}/${name}/${i}`, label: subject(person, mood.kind), forms, accepted: forms };
  });
}

export function buildSheet(table: InflectionTable): Sheet {
  const sections: SheetSection[] = MOODS.map((mood) => ({
    id: mood.id,
    name: mood.name,
    short: mood.short,
    pairs: mood.tenses.map((tense) => {
      const pair: Exercise[] = [
        {
          name: tense.name,
          compound: false,
          folded: tense.folded ?? false,
          blanks: simpleBlanks(table, mood, tense),
        },
      ];
      if (tense.compound) {
        pair.push({
          name: tense.compound,
          compound: true,
          folded: true,
          blanks: compoundBlanks(table, mood, tense, tense.compound),
        });
      }
      return pair;
    }),
  }));

  // The participle agrees only when used as an adjective (las cartas escritas); all four are right.
  // Some have a second, adjectival form (pagado, pago; elegido, electo): right, but not shown.
  const participle = formsOf(table, 'pp|m|s').slice(0, 1);
  const agreed = ['pp|m|s', 'pp|f|s', 'pp|m|p', 'pp|f|p'].flatMap((tags) => formsOf(table, tags));
  const gerund = formsOf(table, 'ger');
  sections.push({
    id: 'formas',
    name: 'Formas no personales',
    short: 'Part.',
    pairs: [
      [
        {
          name: 'Gerundio y participio',
          compound: false,
          folded: false,
          blanks: [
            { id: 'formas/gerundio', label: 'gerundio', forms: gerund, accepted: gerund },
            { id: 'formas/participio', label: 'participio', forms: participle, accepted: [...new Set(agreed)] },
          ],
        },
      ],
    ],
  });

  return { lemma: table.lemma, pos: table.pos, sections };
}
