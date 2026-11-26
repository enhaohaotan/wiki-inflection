import type { InflectionTable } from '../core/types';
import type { LookupResult } from '../features/lookup/lookup';
import type { StoredTable } from './saved';

/**
 * A conjugation turned into fill-in-the-blank exercises: one blank per
 * person of every tense. The same shape for every language; each language
 * builds it from its own tables (see PracticeLanguage.buildSheet).
 */

export interface Blank {
  /** Stable within a sheet, e.g. "indicatif/Passé composé/0". */
  id: string;
  /** Shown before the blank: the subject (je, que tu, (nous)) or the participle's name. */
  label: string;
  /** The answer as the viewer writes it, e.g. ["suis allé(e)"]; [] when the verb has no form here. */
  forms: string[];
  /** Every spelling accepted as correct, e.g. "suis allé" and "suis allée". */
  accepted: string[];
}

export interface Exercise {
  /** Tense name in the language practised, e.g. "Passé composé". */
  name: string;
  /** Built from an auxiliary and a participle. */
  compound: boolean;
  /** Shown folded at first, e.g. compound and literary tenses. */
  folded: boolean;
  blanks: Blank[];
}

export interface SheetSection {
  /** Used in element ids, e.g. "indicatif". */
  id: string;
  /** Mood name in the language practised, e.g. "Indicatif". */
  name: string;
  /** Short name in the bar of section links, e.g. "Ind.". */
  short: string;
  /** Tenses shown side by side, e.g. a simple tense and the compound tense built on it. */
  pairs: Exercise[][];
}

export interface Sheet {
  lemma: string;
  pos: string;
  sections: SheetSection[];
}

export type PracticeResult =
  /** `page`: the Wiktionary page the table comes from. */
  | { status: 'ok'; table: InflectionTable; page: string }
  | Exclude<LookupResult, { status: 'ok' }>;

/**
 * How much of a verb's conjugation has to be learned, which sets how often
 * the Random button picks it (see random.ts).
 */
export type VerbKind = 'regular' | 'spelling' | 'irregular';

/**
 * Everything the practice page and the fetch script need from a language.
 * French is in ./fr; a new language adds a folder like it and an entry in
 * languages.ts.
 */
export interface PracticeLanguage {
  /** Code in the address (#/fr/aller), on Wiktionary and in lang attributes, e.g. "fr". */
  code: string;
  /** Name in English, e.g. "French". */
  name: string;
  /** Name in the language itself, shown in the language picker, e.g. "Français". */
  ownName: string;
  /** The word "verb" in the language, shown in the empty search box, e.g. "verbe". */
  placeholder: string;
  /** The flag's colours in equal parts, left to right, for the strip along the top, e.g. ['#000091', '#ffffff', '#e1000f']. */
  flag: readonly string[];
  /** BCP 47 locale for case folding, e.g. "fr". */
  locale: string;
  /**
   * Whether the language can be practised. A language not ready yet only
   * lists its verbs on the home page; its other pages stay empty.
   */
  ready: boolean;
  /** The verbs on the practice list, in dictionary order; their tables are saved with the page. */
  verbs: readonly string[];
  /** Verbs shown first on the home page, numbered, in learning order. Each is on `verbs` too. */
  keyVerbs: readonly string[];
  /** The saved table of a verb on the list, however it is typed; undefined for other verbs. */
  savedTable(verb: string): InflectionTable | undefined;
  /** Looks a verb up on Wiktionary and picks the table to practise. */
  lookup(verb: string, signal?: AbortSignal): Promise<PracticeResult>;
  /** Turns a table into exercises. */
  buildSheet(table: InflectionTable): Sheet;
  /** The Wiktionary page to credit for a saved table. */
  sourcePage(table: InflectionTable): string;
  /** How regular a verb is, from its table (or its infinitive when there is none). */
  kindOf(verb: string, table: InflectionTable | undefined): VerbKind;
  /** Whether a fetched table has everything; the fetch script fetches an incomplete one again. */
  isComplete(table: StoredTable): boolean;
  /** Shown when a word is not found, e.g. "Check the spelling, including accents (é, è, ê, ç)." */
  spellingHint: string;
}
