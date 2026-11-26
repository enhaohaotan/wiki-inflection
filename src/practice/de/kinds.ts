import type { InflectionTable } from '../../core/types';
import type { VerbKind } from '../types';
import { plainVerb } from './reflexive';

/**
 * How regular a German verb is, from the class Wiktionary gives it: a weak
 * verb takes the regular endings; a strong, mixed, preterite-present or
 * irregular one changes its stem. A weak verb whose stem adds an e before
 * some endings (arbeitest, öffnet) or drops one (lächle, ändre) counts as a
 * spelling change.
 */

const SPELLING = /(?:[dt]en|[^aeiouäöülrh][mn]en|eln|ern)$/;

export function kindOf(verb: string, table: InflectionTable | undefined): VerbKind {
  const verbClass = table?.meta.class ?? '';
  if (/strong|mixed|preterite-present|irregular/.test(verbClass)) return 'irregular';
  // Without a table (only until the tables are saved), go by the ending alone.
  return SPELLING.test(plainVerb(verb)) ? 'spelling' : 'regular';
}
