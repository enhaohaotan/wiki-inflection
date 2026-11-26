import type { InflectionTable } from '../../core/types';
import type { VerbKind } from '../types';
import { plainVerb } from './reflexive';

/**
 * How regular a Spanish verb is, from the class Wiktionary gives its table:
 * "irregular"; a stem or spelling change ("e-ie alternation", "c-qu
 * alternation"); or none for a verb that only takes its group's endings.
 */

/** Endings whose stem changes its spelling somewhere (busqué, llegué, empecé, cojo). */
const SPELLING = /(?:car|gar|zar|ger|gir|guir|cer|cir)$/;

export function kindOf(verb: string, table: InflectionTable | undefined): VerbKind {
  if (table) {
    const verbClass = table.meta.class ?? '';
    if (verbClass.includes('irregular')) return 'irregular';
    return verbClass ? 'spelling' : 'regular';
  }
  // Without a table (only until the tables are saved), go by the ending alone.
  return SPELLING.test(plainVerb(verb)) ? 'spelling' : 'regular';
}
