import type { InflectionTable } from '../core/types';
import { lookup, type LookupResult } from '../features/lookup/lookup';
import { french } from '../languages/fr';
import { isPronominal, plainVerb, pronominalTable } from './pronominal';
import { practiceTable } from './savedTables';

export type PracticeResult =
  /** `page`: the Wiktionary page the table comes from. */
  | { status: 'ok'; table: InflectionTable; page: string }
  | Exclude<LookupResult, { status: 'ok' }>;

/** The table of `verb` in what Wiktionary returned, if it has one. */
function tableIn(result: LookupResult, verb: string): InflectionTable | undefined {
  if (result.status !== 'ok') return undefined;
  return result.entry.tables.find((t) => t.lemma === verb) ?? practiceTable(result);
}

/**
 * Looks up the table to practise `verb` with. A pronominal verb Wiktionary
 * has no table for (se coucher, shown as coucher; s'excuser, no page at all)
 * gets one built from its plain verb's table.
 */
export async function practiceLookup(verb: string, signal?: AbortSignal): Promise<PracticeResult> {
  const result = await lookup(french, verb, signal);
  const table = tableIn(result, verb);
  const page = result.status === 'ok' ? result.entry.title : verb;
  if (table && (table.lemma === verb || !isPronominal(verb))) return { status: 'ok', table, page };

  if (isPronominal(verb)) {
    const plain = plainVerb(verb);
    if (table?.lemma === plain) return { status: 'ok', table: pronominalTable(table, verb), page };
    if (result.status === 'not-found' || result.status === 'no-inflection' || result.status === 'no-language') {
      const plainResult = await lookup(french, plain, signal);
      const plainTable = tableIn(plainResult, plain);
      if (plainTable?.lemma === plain && plainResult.status === 'ok') {
        return { status: 'ok', table: pronominalTable(plainTable, verb), page: plainResult.entry.title };
      }
    }
  }
  if (table) return { status: 'ok', table, page };
  return result.status === 'ok' ? { status: 'no-inflection', query: verb } : result;
}
