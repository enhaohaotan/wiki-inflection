import type { InflectionTable } from '../../core/types';
import { lookup, type LookupResult } from '../../features/lookup/lookup';
import { german } from '../../languages/de';
import type { PracticeResult } from '../types';
import { isReflexive, plainVerb, reflexiveTable } from './reflexive';

/** The table of `verb` in what Wiktionary returned; after a reverse lookup (machte), the verb's table. */
function tableIn(result: LookupResult, verb: string): InflectionTable | undefined {
  if (result.status !== 'ok') return undefined;
  return result.entry.tables.find((t) => t.lemma === verb) ?? result.entry.tables[0];
}

/**
 * Looks up the table to practise `verb` with. A reflexive verb (sich freuen)
 * has no page of its own: its table is built from the plain verb's.
 */
export async function practiceLookup(verb: string, signal?: AbortSignal): Promise<PracticeResult> {
  const plain = plainVerb(verb);
  const result = await lookup(german, plain, signal);
  const table = tableIn(result, plain);
  if (!table) return result.status === 'ok' ? { status: 'no-inflection', query: verb } : result;
  const page = table.meta.page ?? plain;
  return { status: 'ok', table: isReflexive(verb) ? reflexiveTable(table, verb) : table, page };
}
