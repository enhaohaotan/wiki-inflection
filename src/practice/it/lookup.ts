import { italian } from '../../languages/it';
import { isReflexive, plainVerb, reflexiveTable } from '../../languages/it/verb/reflexive';
import { practiceLookup as lookupWith } from '../conjugation';
import type { PracticeResult } from '../types';

/**
 * Looks up the table to practise `verb` with. A reflexive verb with no
 * table of its own gets one built from its plain verb's (alzarsi from alzare).
 */
export function practiceLookup(verb: string, signal?: AbortSignal): Promise<PracticeResult> {
  return lookupWith(italian, { isReflexive, plainVerb, build: reflexiveTable, ownTables: true }, verb, signal);
}
