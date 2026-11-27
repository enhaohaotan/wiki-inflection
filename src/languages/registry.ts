import type { LanguageEntry } from '../core/types';

/**
 * Fetches another page and returns its section for the same language, or
 * null when the page or the section does not exist. Throws on network errors.
 */
export type SectionFetcher = (title: string) => Promise<Element | null>;

/** Fetches a whole page (e.g. an appendix, which has no language section), or null. */
export type DocumentFetcher = (title: string) => Promise<Document | null>;
import { danish } from './da';
import { german } from './de';
import { spanish } from './es';
import { french } from './fr';
import { italian } from './it';

/**
 * What a language has to provide to be searchable. Parsing is kept free of
 * UI code; the matching view is registered separately in `views.tsx`.
 */
export interface LanguageModule {
  /** Short code used in URLs and cache keys, e.g. "fr". */
  code: string;
  /** Display name, e.g. "French". */
  name: string;
  /** BCP 47 locale for case-folding and text, e.g. "fr". */
  locale: string;
  /** The language's level-2 heading on en.wiktionary.org, e.g. "French". */
  heading: string;
  /** Shown when a word is not found, e.g. "Check the spelling, including accents (é, è, ê, ç)." */
  spellingHint: string;
  /**
   * The flag's colours in equal parts, left to right, for the strip along
   * the top, e.g. ['#000091', '#ffffff', '#e1000f']. None: no strip.
   */
  flag?: readonly string[];
  /** Extracts everything we support from that language's section of a page. */
  parse(section: Element, pageTitle: string): LanguageEntry;
  /**
   * Optional second step that adds data from other pages, e.g. the agreed
   * forms of a French past participle. If it throws, the parsed entry is
   * still shown, just without the extra data.
   */
  enrich?(entry: LanguageEntry, fetchSection: SectionFetcher, fetchDocument: DocumentFetcher): Promise<LanguageEntry>;
  /** Turns what was typed into a page title to look up, e.g. "25" -> "femogtyve". */
  normalizeQuery?(query: string): string;
  /**
   * For a page that is an inflected form rather than a dictionary form,
   * the dictionary forms it belongs to, most likely first (e.g. "vais" ->
   * ["aller"]). Used for reverse lookup.
   */
  lemmasOf?(section: Element, pageTitle: string): string[];
}

/** In the order of the language picker. */
export const languages: readonly LanguageModule[] = [french, german, spanish, italian, danish];

export const defaultLanguage: LanguageModule = french;

export function getLanguage(code: string): LanguageModule | undefined {
  return languages.find((l) => l.code === code);
}
