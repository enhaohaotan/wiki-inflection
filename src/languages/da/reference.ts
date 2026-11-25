import { readStored, writeStored } from '../../features/lookup/cache';
import { fetchPageHtml, WiktionaryError } from '../../wiktionary/client';
import { findLanguageSection, parsePage } from '../../wiktionary/page';
import type { DocumentFetcher } from '../registry';
import { APPENDIX_TITLE, parseNumeralAppendix, type NumeralGroup } from './numeral/parse';
import { findPersonalTable, parsePersonalRows, type PersonalRow } from './pronoun/parse';

/**
 * Danish reference tables shown on the home page: all personal pronouns and
 * all numerals. Both come from Wiktionary and are kept locally once loaded.
 */

/** The numerals appendix, fetched at most once per session. */
let appendix: Promise<NumeralGroup[]> | null = null;

export function numeralAppendix(fetchDocument: DocumentFetcher): Promise<NumeralGroup[]> {
  appendix ??= fetchDocument(APPENDIX_TITLE).then((doc) => (doc ? parseNumeralAppendix(doc) : []));
  // A failed fetch is not remembered, so the next lookup tries again.
  appendix.catch(() => (appendix = null));
  return appendix;
}

export interface DanishReference {
  personal: PersonalRow[];
  numerals: NumeralGroup[];
}

const KEY = 'reference:da';

async function fetchDocument(title: string): Promise<Document | null> {
  try {
    return parsePage(await fetchPageHtml(title));
  } catch (err) {
    if (err instanceof WiktionaryError && err.kind === 'not-found') return null;
    throw err;
  }
}

/** Loads both tables, from local storage when they were loaded before. */
export async function loadDanishReference(): Promise<DanishReference> {
  const stored = readStored<DanishReference>(KEY);
  if (stored) return stored;

  const [jeg, numerals] = await Promise.all([fetchDocument('jeg'), numeralAppendix(fetchDocument)]);
  // Every personal pronoun page carries the table of all of them; jeg's is as good as any.
  const section = jeg && findLanguageSection(jeg, 'Danish');
  const table = section && findPersonalTable(section);
  const reference = { personal: table ? parsePersonalRows(table) : [], numerals };
  if (reference.personal.length && reference.numerals.length) writeStored(KEY, reference);
  return reference;
}
