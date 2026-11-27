import { hasTags, type Inflection, type InflectionTable } from '../../../core/types';
import { layOut, type ConjugationLayout, type Language, type MoodKind } from '../../conjugation';
import { PERSONS } from '../../verbTables';
import { AUXILIARY_FORMS, auxiliariesInRule, type AuxiliaryUse, type AuxTense } from './auxiliaries';
import { expandForm } from './notation';

/**
 * French, described for the shared engine (../../conjugation.ts): its moods
 * and tenses, and how its words are spelled. The simple tenses come from the
 * table; a compound tense is the auxiliary Wiktionary's rule for it names
 * (avoir, être, or both) and the past participle, which agrees after être
 * (suis allé(e)). Answers are written in a compact notation (allé(e)(s),
 * dissous / dissoute), shown as it is and spelled out for checking
 * (./notation.ts).
 */

// ---- Words: the subject pronoun and its elision (j'ai, qu'il), the
// participle's agreement (allé(e)s), a compound form from the auxiliary
// (suis allé(e), me suis assis(e)).

export type Person = '1' | '2' | '3';
export type Num = 's' | 'p';

const PRONOUNS: Record<string, string> = {
  '1s': 'je',
  '2s': 'tu',
  '3s': 'il/elle/on',
  '1p': 'nous',
  '2p': 'vous',
  '3p': 'ils/elles',
};

export const REFLEXIVE_PRONOUNS: Record<string, string> = {
  '1s': 'me',
  '2s': 'te',
  '3s': 'se',
  '1p': 'nous',
  '2p': 'vous',
  '3p': 'se',
};

export const VOWEL_START = /^[aàâäæeéèêëiîïoôöœuùûüy]/i;

/**
 * Subject pronoun as it is written before `form`, including elision
 * (je -> j’ before a vowel sound; que -> qu’ before il/ils).
 */
export function pronounFor(person: Person, num: Num, kind: MoodKind, form: string | undefined): string {
  const base = PRONOUNS[person + num] ?? '';
  if (kind === 'imperative') return `(${base})`;

  let pronoun = base;
  if (person === '1' && num === 's' && form) {
    if (VOWEL_START.test(form)) pronoun = 'j’';
    // Spelling can't tell a mute h (j’habite) from an aspirated one (je hais).
    else if (/^h/i.test(form)) pronoun = 'je (j’)';
  }
  if (kind === 'subjunctive') {
    return person === '3' ? `qu’${pronoun}` : `que ${pronoun}`;
  }
  return pronoun;
}

/** Participle forms that agree with the subject: masculine/feminine, singular/plural. */
export interface ParticipleForms {
  ms: string;
  fs?: string;
  mp?: string;
  fp?: string;
}

/**
 * Compact textbook notation for the participle forms a subject can take,
 * e.g. allé(e), allé(e)s, allé(e)(s); "dissous / dissoute" when the forms
 * don't share a stem.
 */
export function agreementNotation(person: Person, num: Num, p: ParticipleForms): string {
  const variants =
    num === 's'
      ? [p.ms, p.fs]
      : person === '2'
        ? // vous can address one person or several
          [p.ms, p.fs, p.mp, p.fp]
        : [p.mp, p.fp];
  const forms = [...new Set(variants.filter((v): v is string => Boolean(v)))];
  if (forms.length === 0) return p.ms;
  if (forms.length === 1) return forms[0]!;

  if (forms.every((f) => f.startsWith(p.ms))) {
    const suffixes = new Set(forms.map((f) => f.slice(p.ms.length)));
    const is = (...want: string[]) => suffixes.size === want.length && want.every((w) => suffixes.has(w));
    if (is('', 'e')) return `${p.ms}(e)`;
    if (is('s', 'es')) return `${p.ms}(e)s`;
    if (is('', 'es')) return `${p.ms}(es)`;
    if (is('', 's')) return `${p.ms}(s)`;
    if (is('', 'e', 's', 'es') || is('', 'e', 'es')) return `${p.ms}(e)(s)`;
  }
  return forms.join(' / ');
}

/** The slot with exactly these tags, in any order. */
export function slotOf(table: InflectionTable, tags: string[]): Inflection | undefined {
  return table.inflections.find((i) => i.tags.length === tags.length && hasTags(i, tags));
}

export function participleOf(table: InflectionTable): ParticipleForms | null {
  const ms = slotOf(table, ['pp'])?.forms[0];
  if (!ms) return null;
  return {
    ms,
    fs: slotOf(table, ['pp', 'f', 's'])?.forms[0],
    mp: slotOf(table, ['pp', 'm', 'p'])?.forms[0],
    fp: slotOf(table, ['pp', 'f', 'p'])?.forms[0],
  };
}

/** One way of forming a compound tense for one person, e.g. "suis allé(e)". */
export function compoundForm(
  use: AuxiliaryUse,
  auxTense: AuxTense,
  person: Person,
  num: Num,
  participle: ParticipleForms,
): string | null {
  const aux = AUXILIARY_FORMS[use.auxiliary][auxTense][person + num];
  if (!aux) return null;
  // With être the participle agrees with the subject; with avoir it does not.
  const pp = use.auxiliary === 'être' ? agreementNotation(person, num, participle) : participle.ms;
  if (!use.reflexive) return `${aux} ${pp}`;
  const reflexive = REFLEXIVE_PRONOUNS[person + num]!;
  // me/te/se elide before a vowel: before "en" always (m'en suis), else as the auxiliary starts.
  const next = use.en ? `en ${aux}` : aux;
  const clitics = /^[mts]e$/.test(reflexive) && VOWEL_START.test(next) ? `${reflexive[0]}'${next}` : `${reflexive} ${next}`;
  return `${clitics} ${pp}`;
}

// ---- The language, for the engine.

/** A compound tense: Wiktionary's rule for it, which names the auxiliary, and the auxiliary's tense. */
interface Build {
  rule: string;
  auxTense: AuxTense;
}

interface Verb {
  table: InflectionTable;
  participle: ParticipleForms | null;
}

const IMPERATIVE_PERSONS = [
  ['2', 's'],
  ['1', 'p'],
  ['2', 'p'],
] as const;

/** A simple tense and the compound tense built on it. */
function pair(simple: string, tags: AuxTense, compound: string, rule: string, folded = false) {
  return [
    { name: simple, tags: [tags], folded },
    { name: compound, build: { rule, auxTense: tags }, on: tags },
  ];
}

/**
 * Folded at first, besides the compound tenses: the tenses of written
 * narrative only (passé simple; imperfect subjunctive).
 */
export const FRENCH: Language<Verb, Build, AuxiliaryUse> = {
  moods: [
    {
      id: 'indicatif',
      name: 'Indicatif',
      short: 'Ind.',
      kind: 'plain',
      persons: PERSONS,
      pairs: [
        pair('Présent', 'pres|indc', 'Passé composé', 'indicative:present perfect'),
        pair('Imparfait', 'impf|indc', 'Plus-que-parfait', 'indicative:pluperfect'),
        pair('Passé simple', 'phis', 'Passé antérieur', 'indicative:past anterior', true),
        pair('Futur simple', 'futr', 'Futur antérieur', 'indicative:future perfect'),
      ],
    },
    {
      id: 'conditionnel',
      name: 'Conditionnel',
      short: 'Cond.',
      kind: 'plain',
      persons: PERSONS,
      pairs: [pair('Présent', 'cond', 'Passé', 'indicative:conditional perfect')],
    },
    {
      id: 'subjonctif',
      name: 'Subjonctif',
      short: 'Subj.',
      kind: 'subjunctive',
      persons: PERSONS,
      pairs: [
        pair('Présent', 'pres|subj', 'Passé', 'subjunctive:past'),
        pair('Imparfait', 'impf|subj', 'Plus-que-parfait', 'subjunctive:pluperfect', true),
      ],
    },
    {
      id: 'imperatif',
      name: 'Impératif',
      short: 'Impér.',
      kind: 'imperative',
      persons: IMPERATIVE_PERSONS,
      pairs: [pair('Présent', 'impr', 'Passé', 'imperative:compound')],
    },
  ],

  forms: [
    {
      id: 'participe',
      name: 'Participe',
      short: 'Part.',
      tense: 'Participe',
      rows({ table }) {
        // The infinitive is the headword itself, so only the participles are asked.
        return [
          ['ppr', 'présent'],
          ['pp', 'passé'],
        ].flatMap(([tag, label]) => {
          const slot = slotOf(table, [tag!]);
          if (!slot) return [];
          // The agreed forms (allée, allés, allées) are right too.
          const agreed =
            tag === 'pp' ? table.inflections.filter((i) => i.tags[0] === 'pp' && i.tags.length === 3).flatMap((i) => i.forms) : [];
          return [{ label: label!, shown: slot.forms, accepted: [...new Set([...slot.forms, ...agreed].flatMap(expandForm))] }];
        });
      },
    },
  ],

  // Elided as written before the form (j’ai, que j’aille).
  subject: ([person, num], kind, form) => pronounFor(person as Person, num as Num, kind, form),

  verb: (table) => ({ table, participle: participleOf(table) }),

  auxiliaries({ table, participle }, build, kind) {
    const rule = table.periphrastic.find((p) => p.key === build.rule);
    if (!rule || !participle) return { shown: [], also: [] };
    const uses = auxiliariesInRule(rule.rule);
    // A compound imperative of a pronominal verb is not used.
    return { shown: kind === 'imperative' ? uses.filter((u) => !u.reflexive) : uses, also: [] };
  },

  build({ participle }, build, use, [person, num]) {
    const form = compoundForm(use, build.auxTense, person as Person, num as Num, participle!);
    return form ? { shown: [form], accepted: expandForm(form) } : { shown: [], accepted: [] };
  },

  accepts: expandForm,
};

export function conjugationLayout(table: InflectionTable): ConjugationLayout {
  return layOut(FRENCH, table);
}
