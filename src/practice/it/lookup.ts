import type { InflectionTable } from '../../core/types';
import { lookup, type LookupResult } from '../../features/lookup/lookup';
import { italian } from '../../languages/it';
import type { PracticeResult } from '../types';
import { isReflexive, plainVerb, reflexiveTable } from './reflexive';

/**
 * The table of `verb` in what Wiktionary returned. A page can hold several
 * tables of the same verb, the first with the standard forms and the next
 * with old or regional ones too; the first is the one practised. After a
 * reverse lookup (parlo), the verb's table.
 */
function tableIn(result: LookupResult, verb: string): InflectionTable | undefined {
  if (result.status !== 'ok') return undefined;
  return result.entry.tables.find((t) => t.lemma === verb) ?? (isReflexive(verb) ? undefined : result.entry.tables[0]);
}

/**
 * Looks up the table to practise `verb` with. A reflexive verb with no
 * table of its own gets one built from its plain verb's (alzarsi from alzare).
 */
export async function practiceLookup(verb: string, signal?: AbortSignal): Promise<PracticeResult> {
  const result = await lookup(italian, verb, signal);
  const table = tableIn(result, verb);
  if (table) return { status: 'ok', table, page: table.meta.page ?? verb };

  if (isReflexive(verb)) {
    const plain = plainVerb(verb);
    const plainResult = await lookup(italian, plain, signal);
    const plainTable = tableIn(plainResult, plain);
    if (plainTable) {
      return { status: 'ok', table: reflexiveTable(plainTable, verb), page: plainTable.meta.page ?? plain };
    }
  }
  return result.status === 'ok' ? { status: 'no-inflection', query: verb } : result;
}
