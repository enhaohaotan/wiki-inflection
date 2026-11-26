import { spanish } from '../../languages/es';
import { isReflexive, plainVerb, reflexiveTable } from '../../languages/es/verb/reflexive';
import { practiceLookup as lookupWith } from '../conjugation';
import type { PracticeResult } from '../types';

/**
 * Looks up the table to practise `verb` with. A reflexive verb's table is
 * on its own page or, more often, on its plain verb's (lavarse on lavar's);
 * failing that, it is built from the plain verb's (levantarse from levantar).
 */
export function practiceLookup(verb: string, signal?: AbortSignal): Promise<PracticeResult> {
  return lookupWith(spanish, { isReflexive, plainVerb, build: reflexiveTable, ownTables: true }, verb, signal);
}
