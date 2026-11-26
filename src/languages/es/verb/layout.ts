import type { InflectionTable } from '../../../core/types';
import { formsMood, formsOf, moodOf, type ConjugationLayout, type MoodSpec, type TenseSpec } from '../../conjugation';
import { PERSONS, type Person } from '../../verbTables';
import { isReflexive } from './reflexive';

/**
 * A Spanish conjugation in the shared layout (../../conjugation.ts). The
 * simple tenses come from the table; the compound tenses, which Wiktionary
 * leaves out, are built here from haber and the past participle (he hablado),
 * with the reflexive pronoun first for a reflexive verb (me he llamado).
 */

/** tú, usted, nosotros, vosotros, ustedes: the formal ones are used every day. */
const IMPERATIVE_PERSONS: Person[] = PERSONS.slice(1);

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
const subject = ([person, num]: Person) => SUBJECTS[person + num]!;
const REFLEXIVE_PRONOUNS = ['me', 'te', 'se', 'nos', 'os', 'se'];

/** haber's forms for each simple tense, yo to ellos. */
const HABER: Record<string, string[]> = {
  'pres|ind': ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
  'impf|ind': ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían'],
  pret: ['hube', 'hubiste', 'hubo', 'hubimos', 'hubisteis', 'hubieron'],
  fut: ['habré', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán'],
  cond: ['habría', 'habrías', 'habría', 'habríamos', 'habríais', 'habrían'],
  'pres|sub': ['haya', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
  'impf|sub|ra': ['hubiera', 'hubieras', 'hubiera', 'hubiéramos', 'hubierais', 'hubieran'],
  'impf|sub|se': ['hubiese', 'hubieses', 'hubiese', 'hubiésemos', 'hubieseis', 'hubiesen'],
  'fut|sub': ['hubiere', 'hubieres', 'hubiere', 'hubiéremos', 'hubiereis', 'hubieren'],
};

/**
 * A simple tense and the compound tense built on it. Two sets of tags for
 * the imperfect subjunctive, whose -ra and -se forms are both right; they
 * are also the keys of haber's forms.
 */
interface Tense {
  tags: string[];
  name: string;
  compound?: string;
  folded?: boolean;
}

interface Mood {
  id: string;
  name: string;
  short: string;
  persons: readonly Person[];
  subject(person: Person): string;
  tenses: Tense[];
}

/**
 * Folded at first, besides the compound tenses: the future subjunctive,
 * found only in old texts and legal language.
 */
const MOODS: Mood[] = [
  {
    id: 'indicativo',
    name: 'Indicativo',
    short: 'Ind.',
    persons: PERSONS,
    subject,
    tenses: [
      { tags: ['pres|ind'], name: 'Presente', compound: 'Pretérito perfecto' },
      { tags: ['impf|ind'], name: 'Pretérito imperfecto', compound: 'Pretérito pluscuamperfecto' },
      { tags: ['pret'], name: 'Pretérito indefinido', compound: 'Pretérito anterior' },
      { tags: ['fut'], name: 'Futuro', compound: 'Futuro perfecto' },
    ],
  },
  {
    id: 'condicional',
    name: 'Condicional',
    short: 'Cond.',
    persons: PERSONS,
    subject,
    tenses: [{ tags: ['cond'], name: 'Condicional simple', compound: 'Condicional compuesto' }],
  },
  {
    id: 'subjuntivo',
    name: 'Subjuntivo',
    short: 'Subj.',
    persons: PERSONS,
    subject: (person) => `que ${subject(person)}`,
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
    persons: IMPERATIVE_PERSONS,
    subject: ([person, num]) => `(${IMPERATIVE_SUBJECTS[person + num]})`,
    tenses: [{ tags: ['imp'], name: 'Afirmativo' }],
  },
];

function simpleTense(table: InflectionTable, tense: Tense): TenseSpec {
  return {
    name: tense.name,
    compound: false,
    folded: tense.folded ?? false,
    answer(person) {
      const forms = [...new Set(tense.tags.flatMap((tags) => formsOf(table, `${person.join('|')}|${tags}`)))];
      return { shown: forms, accepted: forms };
    },
  };
}

function compoundTense(table: InflectionTable, tense: Tense, name: string): TenseSpec {
  const participle = formsOf(table, 'past|part|m|s')[0];
  const reflexive = isReflexive(table.lemma);
  return {
    name,
    compound: true,
    folded: true,
    answer(person, i) {
      // No compound form where the verb has no simple one (llover: only "llueve").
      if (!participle || formsOf(table, `${person.join('|')}|${tense.tags[0]}`).length === 0) {
        return { shown: [], accepted: [] };
      }
      const pronoun = reflexive ? `${REFLEXIVE_PRONOUNS[i]} ` : '';
      const forms = tense.tags.map((tags) => `${pronoun}${HABER[tags]![i]} ${participle}`);
      return { shown: forms, accepted: forms };
    },
  };
}

export function conjugationLayout(table: InflectionTable): ConjugationLayout {
  const moods: MoodSpec[] = MOODS.map((mood) => ({
    ...mood,
    pairs: mood.tenses.map((tense) => [
      simpleTense(table, tense),
      ...(tense.compound ? [compoundTense(table, tense, tense.compound)] : []),
    ]),
  }));

  // The participle agrees only when used as an adjective (las cartas escritas); all four are right.
  // Some have a second, adjectival form (pagado, pago; elegido, electo): right, but not shown.
  const participle = formsOf(table, 'past|part|m|s').slice(0, 1);
  const agreed = ['m|s', 'f|s', 'm|p', 'f|p'].flatMap((tags) => formsOf(table, `past|part|${tags}`));
  const gerund = formsOf(table, 'ger');
  return {
    lemma: table.lemma,
    pos: table.pos,
    moods: [
      ...moods.map(moodOf),
      formsMood('formas', 'Formas no personales', 'Part.', 'Gerundio y participio', [
        { label: 'gerundio', shown: gerund, accepted: gerund },
        { label: 'participio', shown: participle, accepted: [...new Set(agreed)] },
      ]),
    ],
  };
}
