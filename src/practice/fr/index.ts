import { french } from '../../languages/fr';
import { conjugationLayout } from '../../languages/fr/verb/layout';
import { lacksAgreement } from '../../languages/fr/verb/participle';
import { plainVerb } from '../../languages/fr/verb/reflexive';
import { hasForms } from '../conjugation';
import { savedTables, type StoredTable } from '../saved';
import type { PracticeLanguage } from '../types';
import { kindOf } from './kinds';
import { practiceLookup } from './lookup';
import { KEY_VERBS, PRACTICE_VERBS } from './verbs';

/**
 * Whether a table has what the sheet needs: the present (only "il faut" for
 * falloir), the past participle, and its agreed forms (allée, allés, allées)
 * when the verb takes être.
 */
function isComplete(table: StoredTable): boolean {
  return hasForms(table, '3|s|pres|indc', 'pp') && !lacksAgreement(table);
}

export const frenchPractice: PracticeLanguage = {
  code: 'fr',
  name: 'French',
  ownName: 'Français',
  placeholder: 'verbe',
  flag: french.flag,
  locale: 'fr',
  ready: true,
  verbs: PRACTICE_VERBS,
  keyVerbs: KEY_VERBS,
  // A chunk of its own, downloaded when the language is first opened.
  ...savedTables(() => import('./data/verbTables.json?raw'), 'fr', 'fr'),
  lookup: practiceLookup,
  layout: conjugationLayout,
  // The page the table was read from: s'asseoir's is on asseoir's; se lever is built from lever's.
  sourcePage: (table) => table.meta.page ?? plainVerb(table.lemma),
  kindOf,
  isComplete,
  spellingHint: french.spellingHint,
};
