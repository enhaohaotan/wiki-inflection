import { spanish } from '../../languages/es';
import { conjugationLayout } from '../../languages/es/verb/layout';
import { plainVerb } from '../../languages/es/verb/reflexive';
import { hasForms } from '../conjugation';
import { savedTables, type StoredTable } from '../saved';
import type { PracticeLanguage } from '../types';
import { kindOf } from './kinds';
import { practiceLookup } from './lookup';
import { KEY_VERBS, PRACTICE_VERBS } from './verbs';

/** Whether a table has what the sheet needs: the present (only "llueve" for llover) and the past participle. */
function isComplete(table: StoredTable): boolean {
  return hasForms(table, '3|s|pres|ind', 'past|part|m|s');
}

export const spanishPractice: PracticeLanguage = {
  code: 'es',
  name: 'Spanish',
  ownName: 'Español',
  placeholder: 'verbo',
  // The middle band is twice as wide: red, yellow, yellow, red.
  flag: spanish.flag,
  locale: 'es',
  ready: true,
  verbs: PRACTICE_VERBS,
  keyVerbs: KEY_VERBS,
  // A chunk of its own, downloaded when the language is first opened.
  ...savedTables(() => import('./data/verbTables.json?raw'), 'es', 'es'),
  lookup: practiceLookup,
  layout: conjugationLayout,
  // The page the table was read from: levantarse's is on levantar's page.
  sourcePage: (table) => table.meta.page ?? plainVerb(table.lemma),
  kindOf,
  isComplete,
  spellingHint: spanish.spellingHint,
};
