import type { InflectionTable, LanguageEntry } from '../core/types';
import type { Person } from './verbTables';

/**
 * A verb's conjugation laid out the same way for every language: moods, in
 * each the tenses side by side in pairs (a simple tense and the compound
 * tense built on it), in each a row per person, then single forms such as
 * the participles. The practice page turns any layout into exercises, and
 * lookup views can show it.
 *
 * The layout is made by one engine, `layOut`, for every language. A
 * language only describes itself (see each <code>/verb/layout.ts):
 *   - data: its moods and tenses, their names, the tags of the simple
 *     tenses, which tenses start folded, its subject pronouns;
 *   - word rules: how a compound form is spelled from the auxiliary and the
 *     verb, which auxiliaries a verb takes, its participles and gerund.
 */

export interface ConjugationRow {
  /** Before the form: "io", "che io", "(tu)", "participio passato". */
  label: string;
  /** The answer as written: "sono andato/a"; [] where the verb has no form. */
  shown: string[];
  /** Every spelling that is right: "sono andato", "sono andata". */
  accepted: string[];
  /**
   * The subject as written before each shown form, where it can differ
   * between them (j'ai passé / je suis passé); none for single forms.
   */
  subjects?: string[];
}

export interface ConjugationTense {
  name: string;
  /** Built from a helping verb, not read from the table. */
  compound: boolean;
  /** Shown folded at first: compound tenses, and literary or rare ones. */
  folded: boolean;
  rows: ConjugationRow[];
}

export interface ConjugationMood {
  id: string;
  name: string;
  /** In the bar of section links: "Ind.". */
  short: string;
  pairs: ConjugationTense[][];
}

export interface ConjugationLayout {
  lemma: string;
  pos: string;
  moods: ConjugationMood[];
}

/** The forms of a slot, by its tags joined with "|": "1|s|pres|ind". */
export function formsOf(table: InflectionTable, tags: string): string[] {
  return table.inflections.find((i) => i.tags.join('|') === tags)?.forms ?? [];
}

/** Shapes a mood's labels take: "io", "che io", "(tu)". */
export type MoodKind = 'plain' | 'subjunctive' | 'imperative';

/** A tense read from the table: person and number, then `tags` ("1|s" + "|pres|ind"). */
export interface SimpleTense {
  name: string;
  /** Several when more than one set of forms is right (the -ra and -se forms of Spanish). */
  tags: string[];
  folded?: boolean;
}

/**
 * A tense built from a helping verb. `build` says how, in the language's own
 * terms (the auxiliary's tense, a kind of build); `on` is the simple tense
 * it exists alongside: a person with no form there has none here either
 * (piovere: only "piove", so only "è piovuto").
 */
export interface BuiltTense<Build> {
  name: string;
  build: Build;
  on: string;
  /** Built tenses start folded unless said otherwise. */
  folded?: boolean;
}

export interface MoodData<Build> {
  id: string;
  name: string;
  short: string;
  kind: MoodKind;
  persons: readonly Person[];
  /** Tenses side by side, usually a simple tense and the one built on it. */
  pairs: (SimpleTense | BuiltTense<Build>)[][];
}

/** A built form for one auxiliary: shown as the answer, and every spelling right. */
export interface Built {
  shown: string[];
  accepted: string[];
}

/** A section of single forms after the moods, e.g. the participles. */
export interface FormsData<Verb> {
  id: string;
  name: string;
  short: string;
  /** The name of its one exercise. */
  tense: string;
  /** Its rows; the section is left out when none has a form. */
  rows(verb: Verb): ConjugationRow[];
}

/**
 * A language, described for `layOut`. `Verb` is what the rules need to know
 * of a table (its participle, its auxiliaries...); `Build` how a built tense
 * is named; `Auxiliary` one way of building it (avere, essere).
 */
export interface Language<Verb extends { table: InflectionTable }, Build, Auxiliary> {
  moods: MoodData<Build>[];
  forms: FormsData<Verb>[];
  /** The subject before a form, which can depend on the form (j'ai, je suis). */
  subject(person: Person, kind: MoodKind, form?: string): string;
  /** What the rules need to know of the table. */
  verb(table: InflectionTable): Verb;
  /**
   * The auxiliaries a built tense is made with: those shown as the answer,
   * and others also right (a rarer one, or one only some senses take).
   */
  auxiliaries(verb: Verb, build: Build, kind: MoodKind): { shown: Auxiliary[]; also: Auxiliary[] };
  /** A built form for a person, with one auxiliary. */
  build(verb: Verb, build: Build, auxiliary: Auxiliary, person: Person, index: number): Built;
  /** The spellings a form read from the table stands for; by default itself. */
  accepts?(form: string): string[];
}

const unique = <T>(items: T[]): T[] => [...new Set(items)];

function isBuilt<Build>(tense: SimpleTense | BuiltTense<Build>): tense is BuiltTense<Build> {
  return 'build' in tense;
}

/**
 * The row's label: the subject as written before each form, joined when the
 * forms take different ones (j'ai passé / je suis passé).
 */
function labelOf<Verb extends { table: InflectionTable }, Build, Auxiliary>(
  language: Language<Verb, Build, Auxiliary>,
  person: Person,
  kind: MoodKind,
  shown: string[],
): string {
  if (shown.length === 0) return language.subject(person, kind);
  return unique(shown.map((form) => language.subject(person, kind, form))).join(' / ');
}

/** Lays out a verb's table in the shared layout, by the rules of its language. */
export function layOut<Verb extends { table: InflectionTable }, Build, Auxiliary>(
  language: Language<Verb, Build, Auxiliary>,
  table: InflectionTable,
): ConjugationLayout {
  const verb = language.verb(table);
  const accepts = language.accepts ?? ((form: string) => [form]);

  const tenseOf = (mood: MoodData<Build>, tense: SimpleTense | BuiltTense<Build>): ConjugationTense => {
    const row = (person: Person, shown: string[], accepted: string[]): ConjugationRow => ({
      label: labelOf(language, person, mood.kind, shown),
      shown,
      accepted,
      subjects: shown.map((form) => language.subject(person, mood.kind, form)),
    });

    if (!isBuilt(tense)) {
      const rows = mood.persons.map((person) => {
        const shown = unique(tense.tags.flatMap((tags) => formsOf(table, `${person.join('|')}|${tags}`)));
        return row(person, shown, unique(shown.flatMap(accepts)));
      });
      return { name: tense.name, compound: false, folded: tense.folded ?? false, rows };
    }

    const { shown: usual, also } = language.auxiliaries(verb, tense.build, mood.kind);
    const rows = mood.persons.map((person, i) => {
      if (formsOf(table, `${person.join('|')}|${tense.on}`).length === 0) return row(person, [], []);
      const forms = (auxiliary: Auxiliary) => language.build(verb, tense.build, auxiliary, person, i);
      const shown = unique(usual.flatMap((a) => forms(a).shown));
      const accepted = unique([...usual, ...also].flatMap((a) => forms(a).accepted));
      return row(person, shown, accepted);
    });
    return { name: tense.name, compound: true, folded: tense.folded ?? true, rows };
  };

  // A tense with no form at all is left out (the imperative of dovere), and
  // a mood left with no tense (the imperative of pleuvoir).
  const hasForms = (tense: ConjugationTense) => tense.rows.some((r) => r.shown.length > 0);
  const moods: ConjugationMood[] = language.moods
    .map((mood) => ({
      id: mood.id,
      name: mood.name,
      short: mood.short,
      pairs: mood.pairs
        .map((pair) => pair.map((tense) => tenseOf(mood, tense)).filter(hasForms))
        .filter((pair) => pair.length > 0),
    }))
    .filter((mood) => mood.pairs.length > 0);

  for (const section of language.forms) {
    const rows = section.rows(verb);
    if (!rows.some((r) => r.shown.length > 0)) continue;
    moods.push({
      id: section.id,
      name: section.name,
      short: section.short,
      pairs: [[{ name: section.tense, compound: false, folded: false, rows }]],
    });
  }

  return { lemma: table.lemma, pos: table.pos, moods };
}

/** For matching a looked-up form: case, the kind of apostrophe and spacing don't count. */
export function normalizeForm(text: string): string {
  return text.normalize('NFC').replace(/[\u2019\u02BC]/g, "'").trim().toLowerCase();
}

/** Whether a form in a table is the looked-up word. */
export type FormMatcher = (form: string, query: string) => boolean;

/**
 * Matches a form as it is, or without a reflexive verb's pronoun, which the
 * tables write into the form (m'assois, mi chiamo, freue mich): so a lookup
 * of "assois" finds it.
 */
export function formMatcher(withoutReflexive?: (form: string) => string): FormMatcher {
  return (form, query) => {
    const f = normalizeForm(form);
    const q = normalizeForm(query);
    return f === q || (withoutReflexive !== undefined && withoutReflexive(f) === q);
  };
}

/** For each table, whether it contains the looked-up form. */
export function tablesWithMatch(tables: InflectionTable[], query: string | undefined, matches: FormMatcher): boolean[] {
  return tables.map((table) => !!query && table.inflections.some((i) => i.forms.some((form) => matches(form, query))));
}

/**
 * The one table that stands for an entry after a reverse lookup: the plain
 * verb (être rather than s'être) when it has the form, else the first table
 * that has it (suis: suivre), else the plain verb anyway.
 */
export function mainTable(entry: LanguageEntry, query: string, matches: FormMatcher): InflectionTable | undefined {
  const plain = entry.tables.find((t) => t.lemma === entry.title) ?? entry.tables[0];
  const hits = tablesWithMatch(entry.tables, query, matches);
  const matching = entry.tables.filter((_, i) => hits[i]);
  return plain && matching.includes(plain) ? plain : (matching[0] ?? plain);
}
