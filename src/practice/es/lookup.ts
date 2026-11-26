import type { InflectionTable } from '../../core/types';
import { lookup, type LookupResult } from '../../features/lookup/lookup';
import { spanish } from '../../languages/es';
import type { PracticeResult } from '../types';
import { isReflexive, plainVerb, reflexiveTable } from './reflexive';

/**
 * The table of `verb` in what Wiktionary returned; after a reverse lookup
 * (hablo), the verb's table. A reflexive verb needs its own table, not the
 * plain verb's.
 */
function tableIn(result: LookupResult, verb: string): InflectionTable | undefined {
  if (result.status !== 'ok') return undefined;
  return result.entry.tables.find((t) => t.lemma === verb) ?? (isReflexive(verb) ? undefined : result.entry.tables[0]);
}

/**
 * Looks up the table to practise `verb` with. A reflexive verb without a
 * page of its own is looked for on its plain verb's page (lavarse on
 * lavar's), where Wiktionary usually puts its table; failing that, its table
 * is built from the plain verb's (levantarse from levantar).
 */
export async function practiceLookup(verb: string, signal?: AbortSignal): Promise<PracticeResult> {
  const result = await lookup(spanish, verb, signal);
  const table = tableIn(result, verb);
  if (table) return { status: 'ok', table, page: table.meta.page ?? verb };

  if (isReflexive(verb)) {
    const plain = plainVerb(verb);
    // The reflexive verb's page may already have led to the plain verb's (ducharse -> duchar).
    const plainResult = tableIn(result, plain) ? result : await lookup(spanish, plain, signal);
    // Rate-limited or offline: say so, rather than that there is no table.
    if (plainResult.status === 'error') return plainResult;
    const own = tableIn(plainResult, verb);
    if (own) return { status: 'ok', table: own, page: own.meta.page ?? verb };
    const plainTable = tableIn(plainResult, plain);
    if (plainTable) return { status: 'ok', table: reflexiveTable(plainTable, verb), page: plainTable.meta.page ?? plain };
  }
  return result.status === 'ok' ? { status: 'no-inflection', query: verb } : result;
}
