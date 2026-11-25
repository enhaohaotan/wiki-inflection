import type { InflectionTable } from '../../../core/types';

/**
 * How a Danish adjective is presented: rows for gender/number and degree,
 * columns for indefinite and definite use.
 *
 *               UBESTEMT   BESTEMT
 *   Fælleskøn   stor       store      (en stor bil · den store bil)
 *   Intetkøn    stort      store      (et stort hus · det store hus)
 *   Flertal     store      store
 *   Komparativ  større     større
 *   Superlativ  størst     største    (han er størst · den største)
 *
 * Rows Wiktionary gives no forms for are left out.
 */

export interface AdjectiveRow {
  label: string;
  indefinite: string[];
  definite: string[];
}

export interface DanishAdjective {
  lemma: string;
  rows: AdjectiveRow[];
}

function forms(table: InflectionTable, ...tags: string[]): string[] {
  return table.inflections
    .filter((i) => i.tags.length === tags.length && tags.every((t) => i.tags.includes(t)))
    .flatMap((i) => i.forms);
}

export function layoutDanishAdjective(table: InflectionTable): DanishAdjective {
  const definite = forms(table, 'definite');
  const plural = forms(table, 'plural');
  const comparative = forms(table, 'comparative');
  const rows: AdjectiveRow[] = [
    { label: 'Fælleskøn', indefinite: forms(table, 'common'), definite },
    { label: 'Intetkøn', indefinite: forms(table, 'neuter'), definite },
    { label: 'Flertal', indefinite: plural, definite: plural },
    { label: 'Komparativ', indefinite: comparative, definite: comparative },
    {
      label: 'Superlativ',
      indefinite: forms(table, 'superlative', 'predicative'),
      definite: forms(table, 'superlative', 'attributive'),
    },
  ];
  return {
    lemma: table.lemma,
    rows: rows.filter((r) => r.indefinite.length > 0 || r.definite.length > 0),
  };
}
