import type { InflectionTable } from '../../core/types';
import type { VerbKind } from '../types';

/**
 * How regular a French verb is, judged from its table: a regular -er or
 * second-group verb has only its group's endings; one whose forms follow the
 * endings but change spelling (mangeons, appelle) has a spelling change;
 * anything else is irregular.
 *
 * Judged from the forms, unlike in the other languages: their Wiktionary
 * tables name the verb's class in the heading ("-ere; irregular", "class 4
 * strong"), the French ones do not.
 */

/** -er verbs whose forms are not the -er endings at all. */
const IRREGULAR_ER = ['aller', 'envoyer'];

const REGULAR_ER: [string[], (stem: string, infinitive: string) => string][] = [
  [['1', 's', 'pres', 'indc'], (s) => `${s}e`],
  [['2', 's', 'pres', 'indc'], (s) => `${s}es`],
  [['3', 's', 'pres', 'indc'], (s) => `${s}e`],
  [['1', 'p', 'pres', 'indc'], (s) => `${s}ons`],
  [['2', 'p', 'pres', 'indc'], (s) => `${s}ez`],
  [['3', 'p', 'pres', 'indc'], (s) => `${s}ent`],
  [['1', 'p', 'impf', 'indc'], (s) => `${s}ions`],
  [['3', 's', 'phis'], (s) => `${s}a`],
  [['1', 's', 'futr'], (_, inf) => `${inf}ai`],
  [['pp'], (s) => `${s}é`],
];

/** A slot's forms, without the reflexive pronoun of a pronominal verb (me lève -> lève). */
function forms(table: InflectionTable, tags: string[]): string[] {
  const slot = table.inflections.find((i) => i.tags.length === tags.length && tags.every((t) => i.tags.includes(t)));
  return (slot?.forms ?? []).map((f) => f.replace(/^(?:[mts]'|(?:me|te|se|nous|vous) )/, ''));
}

/** "se lever" -> "lever", "s'appeler" -> "appeler". */
function bareInfinitive(verb: string): string {
  return verb.replace(/^(?:se |s')/, '');
}

export function kindOf(verb: string, table: InflectionTable | undefined): VerbKind {
  const infinitive = bareInfinitive(verb);
  const isEr = infinitive.endsWith('er') && !IRREGULAR_ER.includes(infinitive);
  // Without a table, go by the ending (only until the tables are saved).
  if (!table) return isEr ? 'regular' : 'irregular';

  if (isEr) {
    const stem = infinitive.slice(0, -2);
    const regular = REGULAR_ER.every(([tags, expected]) => {
      const found = forms(table, tags);
      return found.length > 0 && found.every((f) => f === expected(stem, infinitive));
    });
    return regular ? 'regular' : 'spelling';
  }
  // Second group: finir -> finissons.
  if (infinitive.endsWith('ir') && forms(table, ['1', 'p', 'pres', 'indc'])[0]?.endsWith('issons')) return 'regular';
  return 'irregular';
}
