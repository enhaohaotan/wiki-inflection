/**
 * Language-agnostic data model.
 *
 * An inflection table is stored as a flat list of grammatical slots, each
 * identified by tags (e.g. ["1", "s", "pres", "indc"]) rather than by its
 * row/column position. Every language supplies its own parser (HTML -> slots)
 * and its own layout (slots -> what goes on screen), so the same model serves
 * French verbs, Danish adjectives, reverse lookup of an inflected form, etc.
 */

/** One grammatical slot of a paradigm, e.g. "1st person singular present indicative". */
export interface Inflection {
  /** Wiktionary's own grammar tags for the slot, in source order. */
  tags: string[];
  /** Usually one form; several when the slot has accepted variants. */
  forms: string[];
  /**
   * Pronunciations given for the slot. Not guaranteed to pair 1:1 with
   * `forms` (a single spelling can have several pronunciations).
   */
  ipa: string[];
}

/** A slot the source describes with a rule instead of spelling out forms. */
export interface PeriphrasticRule {
  /** Stable identifier, e.g. "indicative:present perfect". */
  key: string;
  /** Label as written in the source (English). */
  label: string;
  /** Name in the entry's own language, when the source provides one. */
  nativeLabel?: string;
  /** e.g. "present indicative of être + past participle". */
  rule: string;
}

export interface InflectionTable {
  /** Language code, e.g. "fr". */
  lang: string;
  /** Part of speech, e.g. "verb". */
  pos: string;
  /** Dictionary form the table belongs to. */
  lemma: string;
  /** Caption from the source, e.g. "Conjugation of s'asseoir". */
  title: string;
  inflections: Inflection[];
  periphrastic: PeriphrasticRule[];
  /** Free-text remarks attached to the table. */
  notes: string[];
  /** Language-specific extras, e.g. { auxiliary: "être" }. */
  meta: Record<string, string>;
}

/** Everything extracted from one language's section of a Wiktionary page. */
export interface LanguageEntry {
  lang: string;
  /** Page title the entry was read from. */
  title: string;
  tables: InflectionTable[];
}

/** True when `inflection` carries every one of `tags`. */
export function hasTags(inflection: Inflection, tags: readonly string[]): boolean {
  return tags.every((t) => inflection.tags.includes(t));
}
