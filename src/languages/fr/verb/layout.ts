import { hasTags, type Inflection, type InflectionTable, type LanguageEntry } from '../../../core/types';
import { AUXILIARY_FORMS, auxiliariesInRule, type AuxiliaryUse, type AuxTense } from './auxiliaries';

/**
 * How a French conjugation is presented: which tags make up which tense,
 * in what order, under which names, and with which subject pronouns.
 * Compound tenses are built here from the auxiliary and the past participle.
 * Pure data + functions, so it can be tested without rendering.
 */

type Person = '1' | '2' | '3';
type Num = 's' | 'p';
type MoodKind = 'plain' | 'subjunctive' | 'imperative';

interface SimpleTenseSpec {
  tags: string[];
  fr: string;
  en: string;
}

interface CompoundTenseSpec {
  /** Key of Wiktionary's rule for this tense, which names the auxiliary. */
  rule: string;
  /**
   * Simple tense the auxiliary is put in. It is also the simple tense this
   * compound tense is shown beside (présent / passé composé, ...).
   */
  auxTense: AuxTense;
  fr: string;
  en: string;
}

interface MoodSpec {
  id: string;
  fr: string;
  en: string;
  kind: MoodKind;
  simple: SimpleTenseSpec[];
  compound: CompoundTenseSpec[];
}

const MOODS: MoodSpec[] = [
  {
    id: 'indicatif',
    fr: 'Indicatif',
    en: 'Indicative',
    kind: 'plain',
    simple: [
      { tags: ['pres', 'indc'], fr: 'Présent', en: 'Present' },
      { tags: ['impf', 'indc'], fr: 'Imparfait', en: 'Imperfect' },
      { tags: ['phis'], fr: 'Passé simple', en: 'Past historic' },
      { tags: ['futr'], fr: 'Futur simple', en: 'Future' },
    ],
    compound: [
      { rule: 'indicative:present perfect', auxTense: 'pres|indc', fr: 'Passé composé', en: 'Present perfect' },
      { rule: 'indicative:pluperfect', auxTense: 'impf|indc', fr: 'Plus-que-parfait', en: 'Pluperfect' },
      { rule: 'indicative:past anterior', auxTense: 'phis', fr: 'Passé antérieur', en: 'Past anterior' },
      { rule: 'indicative:future perfect', auxTense: 'futr', fr: 'Futur antérieur', en: 'Future perfect' },
    ],
  },
  {
    id: 'conditionnel',
    fr: 'Conditionnel',
    en: 'Conditional',
    kind: 'plain',
    simple: [{ tags: ['cond'], fr: 'Présent', en: 'Present' }],
    compound: [{ rule: 'indicative:conditional perfect', auxTense: 'cond', fr: 'Passé', en: 'Perfect' }],
  },
  {
    id: 'subjonctif',
    fr: 'Subjonctif',
    en: 'Subjunctive',
    kind: 'subjunctive',
    simple: [
      { tags: ['pres', 'subj'], fr: 'Présent', en: 'Present' },
      { tags: ['impf', 'subj'], fr: 'Imparfait', en: 'Imperfect' },
    ],
    compound: [
      { rule: 'subjunctive:past', auxTense: 'pres|subj', fr: 'Passé', en: 'Past' },
      { rule: 'subjunctive:pluperfect', auxTense: 'impf|subj', fr: 'Plus-que-parfait', en: 'Pluperfect' },
    ],
  },
  {
    id: 'imperatif',
    fr: 'Impératif',
    en: 'Imperative',
    kind: 'imperative',
    simple: [{ tags: ['impr'], fr: 'Présent', en: 'Present' }],
    compound: [{ rule: 'imperative:compound', auxTense: 'impr', fr: 'Passé', en: 'Past' }],
  },
];

const ALL_PERSONS: [Person, Num][] = [
  ['1', 's'],
  ['2', 's'],
  ['3', 's'],
  ['1', 'p'],
  ['2', 'p'],
  ['3', 'p'],
];
const IMPERATIVE_PERSONS: [Person, Num][] = [
  ['2', 's'],
  ['1', 'p'],
  ['2', 'p'],
];

const PRONOUNS: Record<string, string> = {
  '1s': 'je',
  '2s': 'tu',
  '3s': 'il/elle/on',
  '1p': 'nous',
  '2p': 'vous',
  '3p': 'ils/elles',
};

const REFLEXIVE_PRONOUNS: Record<string, string> = {
  '1s': 'me',
  '2s': 'te',
  '3s': 'se',
  '1p': 'nous',
  '2p': 'vous',
  '3p': 'se',
};

const VOWEL_START = /^[aàâäæeéèêëiîïoôöœuùûüy]/i;

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

export interface FormRow {
  pronoun: string;
  /** Empty when the verb has no form for this person (defective verbs). */
  forms: string[];
  /** Each form with the pronoun as written before it (elision can differ per form). */
  parts: { pronoun: string; form: string }[];
}

function rowOf(person: Person, num: Num, kind: MoodKind, forms: string[]): FormRow {
  const parts = forms.map((form) => ({ pronoun: pronounFor(person, num, kind, form), form }));
  const pronouns = [...new Set(parts.map((p) => p.pronoun))];
  return {
    pronoun: pronouns.length > 0 ? pronouns.join(' / ') : pronounFor(person, num, kind, undefined),
    forms,
    parts,
  };
}

export interface TenseBlock {
  fr: string;
  en: string;
  compound: boolean;
  rows: FormRow[];
}

/** A simple tense and the compound tense built on it, shown side by side. */
export interface TensePair {
  simple: TenseBlock;
  compound?: TenseBlock;
}

export interface MoodBlock {
  id: string;
  fr: string;
  en: string;
  pairs: TensePair[];
}

/** A participle, shown in its own section after the moods. */
export interface ParticipleForm {
  /** "Présent" or "Passé". */
  fr: string;
  forms: string[];
  /** Agreed forms not shown but belonging to this slot (allée, allés, allées). */
  agreed: string[];
}

function normalizeForm(text: string): string {
  return text.normalize('NFC').replace(/[\u2019\u02BC]/g, "'").trim().toLocaleLowerCase('fr');
}

/**
 * "m'assois", "nous assoyons", "assois-toi" -> "assois", "assoyons", "assois";
 * with "en" too: "m'en suis", "nous en sommes", "va-t'en" -> "suis", "sommes", "va".
 */
function withoutReflexive(form: string): string {
  return form
    .replace(/^(?:[mts]'en |(?:nous|vous) en |[mts]'|(?:me|te|se|nous|vous) )/, '')
    .replace(/-(?:t'en|(?:nous|vous)-en|toi|nous|vous)$/, '');
}

/** For each table, whether it contains the looked-up form (participle agreement included). */
export function tablesWithMatch(tables: InflectionTable[], query: string | undefined): boolean[] {
  return tables.map(
    (table) => !!query && table.inflections.some((i) => i.forms.some((form) => matchesForm(form, query))),
  );
}

/**
 * The one table that stands for an entry after a reverse lookup: the plain
 * verb (être rather than s'être / s'en être) when it has the form, else the
 * first table that has it, else the plain verb anyway.
 */
export function mainTable(entry: LanguageEntry, query: string): InflectionTable | undefined {
  const plain = entry.tables.find((t) => t.lemma === entry.title) ?? entry.tables[0];
  const hits = tablesWithMatch(entry.tables, query);
  const matching = entry.tables.filter((_, i) => hits[i]);
  return plain && matching.includes(plain) ? plain : (matching[0] ?? plain);
}

/**
 * Whether a form shown in the table is the word that was looked up. Pronominal
 * tables write the pronoun into the form, so "assois" matches "m'assois".
 */
export function matchesForm(form: string, query: string): boolean {
  const f = normalizeForm(form);
  const q = normalizeForm(query);
  return f === q || withoutReflexive(f) === q;
}

export interface Conjugation {
  lemma: string;
  title: string;
  moods: MoodBlock[];
  participles: ParticipleForm[];
}

function find(table: InflectionTable, tags: string[]): Inflection | undefined {
  return table.inflections.find((i) => i.tags.length === tags.length && hasTags(i, tags));
}

function participleOf(table: InflectionTable): ParticipleForms | null {
  const ms = find(table, ['pp'])?.forms[0];
  if (!ms) return null;
  return {
    ms,
    fs: find(table, ['pp', 'f', 's'])?.forms[0],
    mp: find(table, ['pp', 'm', 'p'])?.forms[0],
    fp: find(table, ['pp', 'f', 'p'])?.forms[0],
  };
}

/** One way of forming a compound tense for one person, e.g. "suis allé(e)". */
function compoundForm(
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

function compoundRows(
  table: InflectionTable,
  mood: MoodSpec,
  spec: CompoundTenseSpec,
  persons: [Person, Num][],
  hasPerson: (person: Person, num: Num) => boolean,
): FormRow[] | null {
  const rule = table.periphrastic.find((p) => p.key === spec.rule);
  const participle = participleOf(table);
  if (!rule || !participle) return null;

  let uses = auxiliariesInRule(rule.rule);
  // A compound imperative of a pronominal verb is not used.
  if (mood.kind === 'imperative') uses = uses.filter((u) => !u.reflexive);
  if (uses.length === 0) return null;

  return persons.map(([person, num]): FormRow => {
    const forms = hasPerson(person, num)
      ? uses
          .map((use) => compoundForm(use, spec.auxTense, person, num, participle))
          .filter((f): f is string => f !== null)
      : [];
    // With two auxiliaries the elision can differ (j’ai passé / je suis passé).
    return rowOf(person, num, mood.kind, forms);
  });
}

export function layoutConjugation(table: InflectionTable): Conjugation {
  // The infinitive is the headword itself, so only the participles are listed.
  const participles: ParticipleForm[] = [];
  for (const [tag, fr] of [
    ['ppr', 'Présent'],
    ['pp', 'Passé'],
  ] as const) {
    const slot = find(table, [tag]);
    if (!slot) continue;
    const agreed =
      tag === 'pp'
        ? table.inflections.filter((i) => i.tags[0] === 'pp' && i.tags.length === 3).flatMap((i) => i.forms)
        : [];
    participles.push({ fr, forms: slot.forms, agreed });
  }

  const finite = table.inflections.filter((i) => /^[123]$/.test(i.tags[0] ?? ''));

  const moods: MoodBlock[] = [];
  for (const mood of MOODS) {
    const persons = mood.kind === 'imperative' ? IMPERATIVE_PERSONS : ALL_PERSONS;
    // A compound form exists for a person only where the verb has simple forms
    // for that person (so "pleuvoir" gets "il a plu" but no "j'ai plu").
    const hasPerson = (person: Person, num: Num) =>
      finite.some(
        (i) =>
          i.tags[0] === person && i.tags[1] === num && (mood.kind === 'imperative') === i.tags.includes('impr'),
      );

    const pairs: TensePair[] = [];
    for (const tense of mood.simple) {
      const rows = persons.map(([person, num]): FormRow => {
        const slot = find(table, [person, num, ...tense.tags]);
        return rowOf(person, num, mood.kind, slot?.forms ?? []);
      });
      if (!rows.some((r) => r.forms.length > 0)) continue;

      const pair: TensePair = { simple: { fr: tense.fr, en: tense.en, compound: false, rows } };
      const spec = mood.compound.find((c) => c.auxTense === tense.tags.join('|'));
      const compoundRowsForSpec = spec && compoundRows(table, mood, spec, persons, hasPerson);
      if (spec && compoundRowsForSpec?.some((r) => r.forms.length > 0)) {
        pair.compound = { fr: spec.fr, en: spec.en, compound: true, rows: compoundRowsForSpec };
      }
      pairs.push(pair);
    }
    // A mood with no simple forms at all (e.g. imperative of "pleuvoir") is left out.
    if (pairs.length === 0) continue;

    moods.push({ id: mood.id, fr: mood.fr, en: mood.en, pairs });
  }

  return {
    lemma: table.lemma,
    title: table.title,
    participles,
    moods,
  };
}
