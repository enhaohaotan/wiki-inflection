import { german } from '../../languages/de';
import { isReflexive, plainVerb, reflexiveTable } from '../../languages/de/verb/reflexive';
import { practiceLookup as lookupWith } from '../conjugation';
import type { PracticeResult } from '../types';

/**
 * Looks up the table to practise `verb` with. A reflexive verb (sich freuen)
 * has no page or table of its own: its table is built from the plain verb's.
 */
export function practiceLookup(verb: string, signal?: AbortSignal): Promise<PracticeResult> {
  return lookupWith(german, { isReflexive, plainVerb, build: reflexiveTable, ownTables: false }, verb, signal);
}
