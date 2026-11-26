import type { InflectionTable } from '../../core/types';
import type { Blank, Exercise, Sheet, SheetSection } from '../types';
import { isReflexive, REFLEXIVE_PRONOUNS } from './reflexive';

/**
 * An Italian conjugation as exercises. The simple tenses come from the
 * table; the compound tenses, which Wiktionary only describes through the
 * auxiliary, are built here: the auxiliary's form and the past participle,
 * which agrees with the subject after essere (sono andato/a).
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
const IMPERATIVE_PERSONS: Person[] = [
  ['2', 's'],
  ['1', 'p'],
  ['2', 'p'],
];

const SUBJECTS: Record<string, string> = { '1s': 'io', '2s': 'tu', '3s': 'lui/lei', '1p': 'noi', '2p': 'voi', '3p': 'loro' };

type Kind = 'plain' | 'subjunctive' | 'imperative';

function subject([person, num]: Person, kind: Kind): string {
  const base = SUBJECTS[person + num]!;
  if (kind === 'imperative') return `(${base})`;
  return kind === 'subjunctive' ? `che ${base}` : base;
}

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

interface TenseSpec {
  /** Tags of the simple tense, also the key of the auxiliary's forms. */
  tags: string;
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

/** The passato remoto and trapassato remoto belong to written narrative: folded at first. */
const MOODS: MoodSpec[] = [
  {
    id: 'indicativo',
    name: 'Indicativo',
    short: 'Ind.',
    kind: 'plain',
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
    kind: 'plain',
    tenses: [{ tags: 'cond', name: 'Presente', compound: 'Passato' }],
  },
  {
    id: 'congiuntivo',
    name: 'Congiuntivo',
    short: 'Cong.',
    kind: 'subjunctive',
    tenses: [
      { tags: 'pres|sub', name: 'Presente', compound: 'Passato' },
      { tags: 'impf|sub', name: 'Imperfetto', compound: 'Trapassato' },
    ],
  },
  {
    id: 'imperativo',
    name: 'Imperativo',
    short: 'Imp.',
    kind: 'imperative',
    tenses: [{ tags: 'imp', name: 'Presente' }],
  },
];

function formsOf(table: InflectionTable, tags: string): string[] {
  return table.inflections.find((i) => i.tags.join('|') === tags)?.forms ?? [];
}

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

function simpleBlanks(verb: Verb, mood: MoodSpec, tense: TenseSpec): Blank[] {
  const persons = mood.kind === 'imperative' ? IMPERATIVE_PERSONS : PERSONS;
  return persons.map((person, i) => {
    const forms = formsOf(verb.table, `${person.join('|')}|${tense.tags}`);
    return {
      id: `${mood.id}/${tense.name}/${i}`,
      label: subject(person, mood.kind),
      forms,
      accepted: forms,
    };
  });
}

function compoundBlanks(verb: Verb, mood: MoodSpec, tense: TenseSpec, name: string): Blank[] {
  return PERSONS.map((person, i) => {
    const key = person.join('');
    const plural = person[1] === 'p';
    // No compound form where the verb has no simple one (piovere: only "piove").
    const exists = verb.participle && formsOf(verb.table, `${person.join('|')}|${tense.tags}`).length > 0;
    const shown: string[] = [];
    const accepted: string[] = [];
    if (exists) {
      const pronoun = verb.reflexive ? `${REFLEXIVE_PRONOUNS[key]} ` : '';
      verb.auxiliaries.forEach((auxiliary, n) => {
        const aux = AUXILIARY_FORMS[auxiliary]![tense.tags]![i]!;
        if (auxiliary === 'essere') {
          if (n === 0) shown.push(`${pronoun}${aux} ${agreedNotation(verb.participle!, plural)}`);
          accepted.push(...agreed(verb.participle!, plural).map((p) => `${pronoun}${aux} ${p}`));
        } else {
          if (n === 0) shown.push(`${aux} ${verb.participle}`);
          accepted.push(`${aux} ${verb.participle}`);
        }
      });
    }
    return { id: `${mood.id}/${name}/${i}`, label: subject(person, mood.kind), forms: shown, accepted };
  });
}

export function buildSheet(table: InflectionTable): Sheet {
  const verb = verbOf(table);
  const sections: SheetSection[] = MOODS.map((mood) => ({
    id: mood.id,
    name: mood.name,
    short: mood.short,
    pairs: mood.tenses.map((tense) => {
      const pair: Exercise[] = [
        { name: tense.name, compound: false, folded: tense.folded ?? false, blanks: simpleBlanks(verb, mood, tense) },
      ];
      if (tense.compound) {
        pair.push({
          name: tense.compound,
          compound: true,
          folded: true,
          blanks: compoundBlanks(verb, mood, tense, tense.compound),
        });
      }
      return pair;
    }),
  }));

  const gerund = formsOf(table, 'ger');
  const participles = verb.participle ? [verb.participle] : [];
  sections.push({
    id: 'participio',
    name: 'Participio e gerundio',
    short: 'Part.',
    pairs: [
      [
        {
          name: 'Participio e gerundio',
          compound: false,
          folded: false,
          blanks: [
            {
              id: 'participio/participio passato',
              label: 'participio passato',
              forms: participles,
              // The agreed forms (andata, andati, andate) are right too.
              accepted: [...new Set(participles.flatMap((p) => [...agreed(p, false), ...agreed(p, true)]))],
            },
            { id: 'participio/gerundio', label: 'gerundio', forms: gerund, accepted: gerund },
          ],
        },
      ],
    ],
  });

  return { lemma: table.lemma, pos: table.pos, sections };
}
