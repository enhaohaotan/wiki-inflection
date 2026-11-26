import { conjugationLayout } from '../../languages/it/verb/layout';
import { plainVerb } from '../../languages/it/verb/reflexive';
import { hasForms } from '../conjugation';
import { savedTables, type StoredTable } from '../saved';
import type { PracticeLanguage } from '../types';
import { kindOf } from './kinds';
import { practiceLookup } from './lookup';
import { KEY_VERBS, PRACTICE_VERBS } from './verbs';

/** Whether a table has what the sheet needs: the present (only "piove" for piovere), the past participle and the auxiliary. */
function isComplete(table: StoredTable): boolean {
  return hasForms(table, '3|s|pres|ind', 'past|part', 'aux');
}

export const italianPractice: PracticeLanguage = {
  code: 'it',
  name: 'Italian',
  ownName: 'Italiano',
  placeholder: 'verbo',
  flag: ['#009246', '#ffffff', '#ce2b37'],
  locale: 'it',
  ready: true,
  verbs: PRACTICE_VERBS,
  keyVerbs: KEY_VERBS,
  // A chunk of its own, downloaded when the language is first opened.
  ...savedTables(() => import('./data/verbTables.json?raw'), 'it', 'it'),
  lookup: practiceLookup,
  layout: conjugationLayout,
  // The page the table was read from: chiamarsi has its own; alzarsi is built from alzare's.
  sourcePage: (table) => table.meta.page ?? plainVerb(table.lemma),
  kindOf,
  isComplete,
  spellingHint: 'Check the spelling, including the accent on a final vowel (parlò, sarà, è).',
};
