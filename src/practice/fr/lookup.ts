import { french } from '../../languages/fr';
import { isReflexive, plainVerb, reflexiveTable } from '../../languages/fr/verb/reflexive';
import { practiceLookup as lookupWith } from '../conjugation';
import type { PracticeResult } from '../types';

/**
 * Looks up the table to practise `verb` with. A pronominal verb's table is
 * on its own page or its plain verb's (s'asseoir on asseoir's); failing
 * that, it is built from the plain verb's (se coucher from coucher).
 */
export function practiceLookup(verb: string, signal?: AbortSignal): Promise<PracticeResult> {
  return lookupWith(french, { isReflexive, plainVerb, build: reflexiveTable, ownTables: true }, verb, signal);
}
