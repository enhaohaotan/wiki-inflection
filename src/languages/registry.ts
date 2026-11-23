import type { LanguageEntry } from '../core/types';

/**
 * Fetches another page and returns its section for the same language, or
 * null when the page or the section does not exist. Throws on network errors.
 */
export type SectionFetcher = (title: string) => Promise<Element | null>;
import { french } from './fr';

/**
 * What a language has to provide to be searchable. Parsing is kept free of
 * UI code; the matching view is registered separately in `views.tsx`.
 */
export interface LanguageModule {
  /** Short code used in URLs and cache keys, e.g. "fr". */
  code: string;
  /** Display name, e.g. "French". */
  name: string;
  /** The language's level-2 heading on en.wiktionary.org, e.g. "French". */
  heading: string;
  /** Extracts everything we support from that language's section of a page. */
  parse(section: Element, pageTitle: string): LanguageEntry;
  /**
   * Optional second step that adds data from other pages, e.g. the agreed
   * forms of a French past participle. If it throws, the parsed entry is
   * still shown, just without the extra data.
   */
  enrich?(entry: LanguageEntry, fetchSection: SectionFetcher): Promise<LanguageEntry>;
}

export const languages: readonly LanguageModule[] = [french];

export const defaultLanguage: LanguageModule = french;

export function getLanguage(code: string): LanguageModule | undefined {
  return languages.find((l) => l.code === code);
}
