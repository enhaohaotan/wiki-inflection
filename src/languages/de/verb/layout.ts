import type { InflectionTable } from '../../../core/types';
import { formsOf, layOut, type ConjugationLayout, type Language } from '../../conjugation';
import { PERSONS } from '../../verbTables';
import { USUAL_AUXILIARY } from './auxiliaries';
import { isReflexive, REFLEXIVE_PRONOUNS } from './reflexive';

/**
 * German, described for the shared engine (../../conjugation.ts): its moods
 * and tenses, and how a built form is spelled. The simple tenses come from
 * the table; the others are haben or sein and the past participle (habe
 * gemacht, bin gefahren), or werden and the infinitive (werde machen, würde
 * machen), with the reflexive pronoun after the first verb (habe mich
 * gefreut).
 */

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

/** How a tense is built, with the helping verb in `tense`. */
type Build =
  /** haben/sein + participle: Perfekt, Plusquamperfekt. */
  | { kind: 'perfect'; tense: string }
  /** werden + infinitive: Futur I, würde-Form. */
  | { kind: 'future'; tense: string }
  /** werden + participle + haben/sein: Futur II. */
  | { kind: 'future perfect'; tense: string };

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

/**
 * The built tenses start folded, as in the other languages, and so does
 * the whole Konjunktiv I, which is used in reported speech in writing. A
 * built form exists for each person the present has.
 */
export const GERMAN: Language<Verb, Build, string> = {
  moods: [
    {
      id: 'indikativ',
      name: 'Indikativ',
      short: 'Ind.',
      kind: 'plain',
      persons: PERSONS,
      pairs: [
        [
          { name: 'Präsens', tags: ['pres'] },
          { name: 'Perfekt', build: { kind: 'perfect', tense: 'pres' }, on: 'pres' },
        ],
        [
          { name: 'Präteritum', tags: ['pret'] },
          { name: 'Plusquamperfekt', build: { kind: 'perfect', tense: 'pret' }, on: 'pres' },
        ],
        [
          { name: 'Futur I', build: { kind: 'future', tense: 'pres' }, on: 'pres' },
          { name: 'Futur II', build: { kind: 'future perfect', tense: 'pres' }, on: 'pres' },
        ],
      ],
    },
    {
      id: 'konjunktiv-1',
      name: 'Konjunktiv I',
      short: 'Konj. I',
      kind: 'plain',
      persons: PERSONS,
      pairs: [
        [
          { name: 'Präsens', tags: ['sub:I'], folded: true },
          { name: 'Perfekt', build: { kind: 'perfect', tense: 'sub:I' }, on: 'pres' },
        ],
        [{ name: 'Futur I', build: { kind: 'future', tense: 'sub:I' }, on: 'pres' }],
      ],
    },
    {
      id: 'konjunktiv-2',
      name: 'Konjunktiv II',
      short: 'Konj. II',
      kind: 'plain',
      persons: PERSONS,
      pairs: [
        [
          { name: 'Präteritum', tags: ['sub:II'] },
          { name: 'Plusquamperfekt', build: { kind: 'perfect', tense: 'sub:II' }, on: 'pres' },
        ],
        [{ name: 'würde + Infinitiv', build: { kind: 'future', tense: 'sub:II' }, on: 'pres' }],
      ],
    },
    {
      id: 'imperativ',
      name: 'Imperativ',
      short: 'Imp.',
      kind: 'imperative',
      persons: [
        ['2', 's'],
        ['2', 'p'],
      ],
      pairs: [[{ name: 'Imperativ', tags: ['imp'] }]],
    },
  ],

  forms: [
    {
      id: 'partizip',
      name: 'Partizip',
      short: 'Part.',
      tense: 'Partizip',
      rows({ table }) {
        // Some have a second form (Partizip II of senden: gesandt, gesendet): right, but not shown.
        const row = (tags: string, label: string) => {
          const forms = formsOf(table, tags);
          return { label, shown: forms.slice(0, 1), accepted: forms };
        };
        return [row('pres|part', 'Partizip I'), row('past|part', 'Partizip II')];
      },
    },
  ],

  subject([person, num], kind) {
    const base = SUBJECTS[person + num]!;
    return kind === 'imperative' ? `(${base})` : base;
  },

  verb(table) {
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
  },

  auxiliaries(verb, build) {
    // werden + infinitive needs neither haben nor sein, nor a participle.
    if (build.kind === 'future') return { shown: ['werden'], also: [] };
    if (!verb.participle) return { shown: [], also: [] };
    return { shown: verb.auxiliaries, also: verb.rareAuxiliaries };
  },

  build(verb, build, auxiliary, person, i) {
    const pronoun = verb.reflexive ? ` ${REFLEXIVE_PRONOUNS[person.join('')]}` : '';
    const form =
      build.kind === 'future'
        ? `${WERDEN[build.tense]![i]}${pronoun} ${verb.infinitive}`
        : build.kind === 'perfect'
          ? `${AUXILIARIES[auxiliary]![build.tense]![i]}${pronoun} ${verb.participle}`
          : `${WERDEN[build.tense]![i]}${pronoun} ${verb.participle} ${auxiliary}`;
    return { shown: [form], accepted: [form] };
  },
};

export function conjugationLayout(table: InflectionTable): ConjugationLayout {
  return layOut(GERMAN, table);
}
