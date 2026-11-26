import { auxiliariesInRule } from '../../languages/fr/verb/auxiliaries';
import { conjugationLayout } from '../../languages/fr/verb/conjugation';
import { savedTables, type StoredTable } from '../saved';
import type { PracticeLanguage } from '../types';
import { kindOf } from './kinds';
import { practiceLookup } from './lookup';
import { plainVerb } from './pronominal';
import { KEY_VERBS, PRACTICE_VERBS } from './verbs';

/**
 * Whether a table lacks the agreed participle forms (allée, allés, allées)
 * its compound tenses with être need. They come from a second page, so a
 * lookup interrupted by Wiktionary's rate limit can return the table without
 * them; it is then fetched again rather than saved incomplete.
 */
export function lacksAgreement(table: Pick<StoredTable, 'inflections' | 'periphrastic'>): boolean {
  const usesEtre = table.periphrastic.some(
    (p) => !p.key.startsWith('nonfinite') && auxiliariesInRule(p.rule).some((u) => u.auxiliary === 'être'),
  );
  const agreed = table.inflections.some((i) => i.tags[0] === 'pp' && i.tags.length === 3);
  return usesEtre && !agreed;
}

export const frenchPractice: PracticeLanguage = {
  code: 'fr',
  name: 'French',
  ownName: 'Français',
  placeholder: 'verbe',
  flag: ['#000091', '#ffffff', '#e1000f'],
  locale: 'fr',
  ready: true,
  verbs: PRACTICE_VERBS,
  keyVerbs: KEY_VERBS,
  // A chunk of its own, downloaded when the language is first opened.
  ...savedTables(() => import('./data/verbTables.json?raw'), 'fr', 'fr'),
  lookup: practiceLookup,
  layout: conjugationLayout,
  // A pronominal verb is credited to its plain verb (se lever -> lever),
  // whose page its table is built from.
  sourcePage: (table) => plainVerb(table.lemma),
  kindOf,
  isComplete: (table) => !lacksAgreement(table),
  spellingHint: 'Check the spelling, including accents (é, è, ê, ç).',
};
