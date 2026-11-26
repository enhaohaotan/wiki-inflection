import type { InflectionTable } from '../../../core/types';
import { formsOf, layOut, type ConjugationLayout, type Language } from '../../conjugation';
import { PERSONS, type Person } from '../../verbTables';
import { HABER } from './auxiliaries';
import { isReflexive, REFLEXIVE_PRONOUNS } from './reflexive';

/**
 * Spanish, described for the shared engine (../../conjugation.ts): its
 * moods and tenses, and how a compound form is spelled. The simple tenses
 * come from the table; the compound tenses, which Wiktionary leaves out,
 * are haber and the past participle (he hablado), with the reflexive
 * pronoun first for a reflexive verb (me he llamado).
 */

const SUBJECTS: Record<string, string> = {
  '1s': 'yo',
  '2s': 'tú',
  '3s': 'él/ella',
  '1p': 'nosotros',
  '2p': 'vosotros',
  '3p': 'ellos/ellas',
};
/** The imperative is asked of tú, usted, nosotros, vosotros, ustedes: the formal ones are used every day. */
const IMPERATIVE_SUBJECTS: Record<string, string> = {
  '2s': 'tú',
  '3s': 'usted',
  '1p': 'nosotros',
  '2p': 'vosotros',
  '3p': 'ustedes',
};

/**
 * A compound tense: haber in these simple tenses, and the participle. Two
 * for the pluperfect subjunctive, whose -ra and -se forms are both right.
 */
type Build = string[];

interface Verb {
  table: InflectionTable;
  reflexive: boolean;
  participle: string | undefined;
}

const subject = ([person, num]: Person) => SUBJECTS[person + num]!;

/**
 * Folded at first, besides the compound tenses: the future subjunctive,
 * found only in old texts and legal language.
 */
export const SPANISH: Language<Verb, Build, 'haber'> = {
  moods: [
    {
      id: 'indicativo',
      name: 'Indicativo',
      short: 'Ind.',
      kind: 'plain',
      persons: PERSONS,
      pairs: [
        [
          { name: 'Presente', tags: ['pres|ind'] },
          { name: 'Pretérito perfecto', build: ['pres|ind'], on: 'pres|ind' },
        ],
        [
          { name: 'Pretérito imperfecto', tags: ['impf|ind'] },
          { name: 'Pretérito pluscuamperfecto', build: ['impf|ind'], on: 'impf|ind' },
        ],
        [
          { name: 'Pretérito indefinido', tags: ['pret'] },
          { name: 'Pretérito anterior', build: ['pret'], on: 'pret' },
        ],
        [
          { name: 'Futuro', tags: ['fut'] },
          { name: 'Futuro perfecto', build: ['fut'], on: 'fut' },
        ],
      ],
    },
    {
      id: 'condicional',
      name: 'Condicional',
      short: 'Cond.',
      kind: 'plain',
      persons: PERSONS,
      pairs: [
        [
          { name: 'Condicional simple', tags: ['cond'] },
          { name: 'Condicional compuesto', build: ['cond'], on: 'cond' },
        ],
      ],
    },
    {
      id: 'subjuntivo',
      name: 'Subjuntivo',
      short: 'Subj.',
      kind: 'subjunctive',
      persons: PERSONS,
      pairs: [
        [
          { name: 'Presente', tags: ['pres|sub'] },
          { name: 'Pretérito perfecto', build: ['pres|sub'], on: 'pres|sub' },
        ],
        [
          { name: 'Pretérito imperfecto', tags: ['impf|sub|ra', 'impf|sub|se'] },
          { name: 'Pretérito pluscuamperfecto', build: ['impf|sub|ra', 'impf|sub|se'], on: 'impf|sub|ra' },
        ],
        [
          { name: 'Futuro', tags: ['fut|sub'], folded: true },
          { name: 'Futuro perfecto', build: ['fut|sub'], on: 'fut|sub' },
        ],
      ],
    },
    {
      id: 'imperativo',
      name: 'Imperativo',
      short: 'Imp.',
      kind: 'imperative',
      persons: PERSONS.slice(1),
      pairs: [[{ name: 'Afirmativo', tags: ['imp'] }]],
    },
  ],

  forms: [
    {
      id: 'formas',
      name: 'Formas no personales',
      short: 'Part.',
      tense: 'Gerundio y participio',
      rows({ table }) {
        const gerund = formsOf(table, 'ger');
        // The participle agrees only when used as an adjective (las cartas escritas); all four are right.
        // Some have a second, adjectival form (pagado, pago; elegido, electo): right, but not shown.
        const participle = formsOf(table, 'past|part|m|s').slice(0, 1);
        const agreed = ['m|s', 'f|s', 'm|p', 'f|p'].flatMap((tags) => formsOf(table, `past|part|${tags}`));
        return [
          { label: 'gerundio', shown: gerund, accepted: gerund },
          { label: 'participio', shown: participle, accepted: [...new Set(agreed)] },
        ];
      },
    },
  ],

  subject(person, kind) {
    if (kind === 'imperative') return `(${IMPERATIVE_SUBJECTS[person.join('')]})`;
    return kind === 'subjunctive' ? `que ${subject(person)}` : subject(person);
  },

  verb(table) {
    return { table, reflexive: isReflexive(table.lemma), participle: formsOf(table, 'past|part|m|s')[0] };
  },

  auxiliaries(verb) {
    return verb.participle ? { shown: ['haber'], also: [] } : { shown: [], also: [] };
  },

  build(verb, tenses, _auxiliary, person, i) {
    const pronoun = verb.reflexive ? `${REFLEXIVE_PRONOUNS[person.join('')]} ` : '';
    const forms = tenses.map((tense) => `${pronoun}${HABER[tense]![i]} ${verb.participle}`);
    return { shown: forms, accepted: forms };
  },
};

export function conjugationLayout(table: InflectionTable): ConjugationLayout {
  return layOut(SPANISH, table);
}
