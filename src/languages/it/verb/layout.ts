import type { InflectionTable } from '../../../core/types';
import { formsMood, formsOf, moodOf, type ConjugationLayout, type MoodSpec, type TenseSpec } from '../../conjugation';
import { PERSONS, type Person } from '../../verbTables';
import { isReflexive, REFLEXIVE_PRONOUNS } from './reflexive';

/**
 * An Italian conjugation in the shared layout (../../conjugation.ts). The
 * simple tenses come from the table; the compound tenses, which Wiktionary
 * only describes through the auxiliary, are built here: the auxiliary's form
 * and the past participle, which agrees with the subject after essere (sono
 * andato/a).
 */

const IMPERATIVE_PERSONS: Person[] = [
  ['2', 's'],
  ['1', 'p'],
  ['2', 'p'],
];

const SUBJECTS: Record<string, string> = { '1s': 'io', '2s': 'tu', '3s': 'lui/lei', '1p': 'noi', '2p': 'voi', '3p': 'loro' };
const subject = ([person, num]: Person) => SUBJECTS[person + num]!;

/** The auxiliaries' forms for each simple tense, io to loro. */
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

/** A simple tense (its tags, also the key of the auxiliary's forms) and the compound tense built on it. */
interface Tense {
  tags: string;
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

/** The passato remoto and trapassato remoto belong to written narrative: folded at first. */
const MOODS: Mood[] = [
  {
    id: 'indicativo',
    name: 'Indicativo',
    short: 'Ind.',
    persons: PERSONS,
    subject,
    tenses: [
      { tags: 'pres|ind', name: 'Presente', compound: 'Passato prossimo' },
      { tags: 'impf|ind', name: 'Imperfetto', compound: 'Trapassato prossimo' },
      { tags: 'phis', name: 'Passato remoto', compound: 'Trapassato remoto', folded: true },
      { tags: 'fut', name: 'Futuro semplice', compound: 'Futuro anteriore' },
    ],
  },
  {
    id: 'condizionale',
    name: 'Condizionale',
    short: 'Cond.',
    persons: PERSONS,
    subject,
    tenses: [{ tags: 'cond', name: 'Presente', compound: 'Passato' }],
  },
  {
    id: 'congiuntivo',
    name: 'Congiuntivo',
    short: 'Cong.',
    persons: PERSONS,
    subject: (person) => `che ${subject(person)}`,
    tenses: [
      { tags: 'pres|sub', name: 'Presente', compound: 'Passato' },
      { tags: 'impf|sub', name: 'Imperfetto', compound: 'Trapassato' },
    ],
  },
  {
    id: 'imperativo',
    name: 'Imperativo',
    short: 'Imp.',
    persons: IMPERATIVE_PERSONS,
    subject: (person) => `(${subject(person)})`,
    tenses: [{ tags: 'imp', name: 'Presente' }],
  },
];

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

function verbOf(table: InflectionTable): Verb {
  const reflexive = isReflexive(table.lemma);
  const auxiliaries = reflexive ? ['essere'] : formsOf(table, 'aux').filter((a) => a in AUXILIARY_FORMS);
  const participle = formsOf(table, 'past|part')[0];
  return {
    table,
    reflexive,
    auxiliaries: auxiliaries.length > 0 ? auxiliaries : ['avere'],
    participle: reflexive ? participle?.replace(/si$/, '') : participle,
  };
}

function simpleTense(verb: Verb, tense: Tense): TenseSpec {
  return {
    name: tense.name,
    compound: false,
    folded: tense.folded ?? false,
    answer(person) {
      const forms = formsOf(verb.table, `${person.join('|')}|${tense.tags}`);
      return { shown: forms, accepted: forms };
    },
  };
}

function compoundTense(verb: Verb, tense: Tense, name: string): TenseSpec {
  return {
    name,
    compound: true,
    folded: true,
    answer(person, i) {
      // No compound form where the verb has no simple one (piovere: only "piove").
      const { participle } = verb;
      if (!participle || formsOf(verb.table, `${person.join('|')}|${tense.tags}`).length === 0) {
        return { shown: [], accepted: [] };
      }
      const plural = person[1] === 'p';
      const pronoun = verb.reflexive ? `${REFLEXIVE_PRONOUNS[person.join('')]} ` : '';
      const shown: string[] = [];
      const accepted: string[] = [];
      verb.auxiliaries.forEach((auxiliary, n) => {
        const aux = AUXILIARY_FORMS[auxiliary]![tense.tags]![i]!;
        if (auxiliary === 'essere') {
          if (n === 0) shown.push(`${pronoun}${aux} ${agreedNotation(participle, plural)}`);
          accepted.push(...agreed(participle, plural).map((p) => `${pronoun}${aux} ${p}`));
        } else {
          if (n === 0) shown.push(`${aux} ${participle}`);
          accepted.push(`${aux} ${participle}`);
        }
      });
      return { shown, accepted };
    },
  };
}

export function conjugationLayout(table: InflectionTable): ConjugationLayout {
  const verb = verbOf(table);
  const moods: MoodSpec[] = MOODS.map((mood) => ({
    ...mood,
    pairs: mood.tenses.map((tense) => [
      simpleTense(verb, tense),
      ...(tense.compound ? [compoundTense(verb, tense, tense.compound)] : []),
    ]),
  }));

  const gerund = formsOf(table, 'ger');
  const participles = verb.participle ? [verb.participle] : [];
  return {
    lemma: table.lemma,
    pos: table.pos,
    moods: [
      ...moods.map(moodOf),
      formsMood('participio', 'Participio e gerundio', 'Part.', 'Participio e gerundio', [
        {
          label: 'participio passato',
          shown: participles,
          // The agreed forms (andata, andati, andate) are right too.
          accepted: [...new Set(participles.flatMap((p) => [...agreed(p, false), ...agreed(p, true)]))],
        },
        { label: 'gerundio', shown: gerund, accepted: gerund },
      ]),
    ],
  };
}
