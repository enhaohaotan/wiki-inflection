import type { InflectionTable } from '../../../core/types';
import { formsOf, layOut, type ConjugationLayout, type Language } from '../../conjugation';
import { PERSONS, type Person } from '../../verbTables';
import { isReflexive, REFLEXIVE_PRONOUNS } from './reflexive';

/**
 * Italian, described for the shared engine (../../conjugation.ts): its
 * moods and tenses, and how a compound form is spelled. The simple tenses
 * come from the table; the compound tenses, which Wiktionary only describes
 * through the auxiliary, are the auxiliary's form and the past participle,
 * which agrees with the subject after essere (sono andato/a).
 */

const SUBJECTS: Record<string, string> = { '1s': 'io', '2s': 'tu', '3s': 'lui/lei', '1p': 'noi', '2p': 'voi', '3p': 'loro' };

/** The auxiliaries' forms in each simple tense, io to loro, by the tense's tags. */
const AUXILIARY_FORMS: Record<string, Record<string, string[]>> = {
  avere: {
    'pres|ind': ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'],
    'impf|ind': ['avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano'],
    phis: ['ebbi', 'avesti', 'ebbe', 'avemmo', 'aveste', 'ebbero'],
    fut: ['avrò', 'avrai', 'avrà', 'avremo', 'avrete', 'avranno'],
    cond: ['avrei', 'avresti', 'avrebbe', 'avremmo', 'avreste', 'avrebbero'],
    'pres|sub': ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'],
    'impf|sub': ['avessi', 'avessi', 'avesse', 'avessimo', 'aveste', 'avessero'],
  },
  essere: {
    'pres|ind': ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'],
    'impf|ind': ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'],
    phis: ['fui', 'fosti', 'fu', 'fummo', 'foste', 'furono'],
    fut: ['sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno'],
    cond: ['sarei', 'saresti', 'sarebbe', 'saremmo', 'sareste', 'sarebbero'],
    'pres|sub': ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'],
    'impf|sub': ['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero'],
  },
};

/** A compound tense: the auxiliary in this simple tense, and the past participle. */
type Build = string;

/** "andato" -> ["andato", "andata"] (singular) or ["andati", "andate"] (plural). */
function agreed(participle: string, plural: boolean): string[] {
  if (!participle.endsWith('o')) return [participle];
  const stem = participle.slice(0, -1);
  return plural ? [`${stem}i`, `${stem}e`] : [`${stem}o`, `${stem}a`];
}

/** "andato" -> "andato/a", "andati/e". */
function agreedNotation(participle: string, plural: boolean): string {
  if (!participle.endsWith('o')) return participle;
  const stem = participle.slice(0, -1);
  return plural ? `${stem}i/e` : `${stem}o/a`;
}

interface Verb {
  table: InflectionTable;
  reflexive: boolean;
  /**
   * avere, essere, or both, the usual one first: finire takes avere (ho
   * finito il libro) or essere (il film è finito). Wiktionary also lists an
   * auxiliary used only in some senses (arrivare: avere, rarely), so only
   * the first is shown as the answer; the other is accepted too. A
   * reflexive verb takes essere.
   */
  auxiliaries: string[];
  /** The plain past participle: alzato, also for alzarsi. */
  participle: string | undefined;
}

/** io, tu, lui/lei, noi, voi, loro; che io...; (tu). */
const subject = ([person, num]: Person) => SUBJECTS[person + num]!;

/** The passato remoto and trapassato remoto belong to written narrative: folded at first. */
export const ITALIAN: Language<Verb, Build, string> = {
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
          { name: 'Passato prossimo', build: 'pres|ind', on: 'pres|ind' },
        ],
        [
          { name: 'Imperfetto', tags: ['impf|ind'] },
          { name: 'Trapassato prossimo', build: 'impf|ind', on: 'impf|ind' },
        ],
        [
          { name: 'Passato remoto', tags: ['phis'], folded: true },
          { name: 'Trapassato remoto', build: 'phis', on: 'phis' },
        ],
        [
          { name: 'Futuro semplice', tags: ['fut'] },
          { name: 'Futuro anteriore', build: 'fut', on: 'fut' },
        ],
      ],
    },
    {
      id: 'condizionale',
      name: 'Condizionale',
      short: 'Cond.',
      kind: 'plain',
      persons: PERSONS,
      pairs: [
        [
          { name: 'Presente', tags: ['cond'] },
          { name: 'Passato', build: 'cond', on: 'cond' },
        ],
      ],
    },
    {
      id: 'congiuntivo',
      name: 'Congiuntivo',
      short: 'Cong.',
      kind: 'subjunctive',
      persons: PERSONS,
      pairs: [
        [
          { name: 'Presente', tags: ['pres|sub'] },
          { name: 'Passato', build: 'pres|sub', on: 'pres|sub' },
        ],
        [
          { name: 'Imperfetto', tags: ['impf|sub'] },
          { name: 'Trapassato', build: 'impf|sub', on: 'impf|sub' },
        ],
      ],
    },
    {
      id: 'imperativo',
      name: 'Imperativo',
      short: 'Imp.',
      kind: 'imperative',
      persons: [
        ['2', 's'],
        ['1', 'p'],
        ['2', 'p'],
      ],
      pairs: [[{ name: 'Presente', tags: ['imp'] }]],
    },
  ],

  forms: [
    {
      id: 'participio',
      name: 'Participio e gerundio',
      short: 'Part.',
      tense: 'Participio e gerundio',
      rows(verb) {
        const participles = verb.participle ? [verb.participle] : [];
        const gerund = formsOf(verb.table, 'ger');
        return [
          {
            label: 'participio passato',
            shown: participles,
            // The agreed forms (andata, andati, andate) are right too.
            accepted: [...new Set(participles.flatMap((p) => [...agreed(p, false), ...agreed(p, true)]))],
          },
          { label: 'gerundio', shown: gerund, accepted: gerund },
        ];
      },
    },
  ],

  subject(person, kind) {
    if (kind === 'imperative') return `(${subject(person)})`;
    return kind === 'subjunctive' ? `che ${subject(person)}` : subject(person);
  },

  verb(table) {
    const reflexive = isReflexive(table.lemma);
    const auxiliaries = reflexive ? ['essere'] : formsOf(table, 'aux').filter((a) => a in AUXILIARY_FORMS);
    const participle = formsOf(table, 'past|part')[0];
    return {
      table,
      reflexive,
      auxiliaries: auxiliaries.length > 0 ? auxiliaries : ['avere'],
      participle: reflexive ? participle?.replace(/si$/, '') : participle,
    };
  },

  auxiliaries(verb) {
    if (!verb.participle) return { shown: [], also: [] };
    return { shown: verb.auxiliaries.slice(0, 1), also: verb.auxiliaries.slice(1) };
  },

  build(verb, tense, auxiliary, person, i) {
    const participle = verb.participle!;
    const aux = AUXILIARY_FORMS[auxiliary]![tense]![i]!;
    if (auxiliary === 'avere') return { shown: [`${aux} ${participle}`], accepted: [`${aux} ${participle}`] };
    const plural = person[1] === 'p';
    const pronoun = verb.reflexive ? `${REFLEXIVE_PRONOUNS[person.join('')]} ` : '';
    return {
      shown: [`${pronoun}${aux} ${agreedNotation(participle, plural)}`],
      accepted: agreed(participle, plural).map((p) => `${pronoun}${aux} ${p}`),
    };
  },
};

export function conjugationLayout(table: InflectionTable): ConjugationLayout {
  return layOut(ITALIAN, table);
}
