import type { InflectionTable } from '../../core/types';
import { plainVerb } from '../../languages/it/verb/reflexive';
import type { VerbKind } from '../types';

/**
 * How regular an Italian verb is. Wiktionary's table says when a verb is
 * irregular ("-ere; irregular"). Of the rest, a verb whose stem changes its
 * spelling before some endings (cercare: cerchi; mangiare: mangi; studiare:
 * studi) counts as a spelling change; the others follow their group's endings.
 */

const SPELLING = /(?:care|gare|iare)$/;

export function kindOf(verb: string, table: InflectionTable | undefined): VerbKind {
  if (table?.meta.class?.includes('irregular')) return 'irregular';
  // Without a table (only until the tables are saved), go by the ending alone.
  return SPELLING.test(plainVerb(verb)) ? 'spelling' : 'regular';
}
