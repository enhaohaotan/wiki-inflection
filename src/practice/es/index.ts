import { savedTables, type StoredTable } from '../saved';
import type { PracticeLanguage } from '../types';
import saved from './data/verbTables.json?raw';
import { kindOf } from './kinds';
import { practiceLookup } from './lookup';
import { buildSheet } from './sheet';
import { KEY_VERBS, PRACTICE_VERBS } from './verbs';

/** Whether a table has what the sheet needs: the present and the past participle. */
function isComplete(table: StoredTable): boolean {
  const has = (tags: string) => table.inflections.some((i) => i.tags.join('|') === tags && i.forms.length > 0);
  return (has('1|s|pres|ind') || has('3|s|pres|ind')) && has('pp|m|s');
}

export const spanishPractice: PracticeLanguage = {
  code: 'es',
  name: 'Spanish',
  ownName: 'Español',
  placeholder: 'verbo',
  // The middle band is twice as wide: red, yellow, yellow, red.
  flag: ['#aa151b', '#f1bf00', '#f1bf00', '#aa151b'],
  locale: 'es',
  ready: true,
  verbs: PRACTICE_VERBS,
  keyVerbs: KEY_VERBS,
  savedTable: savedTables(saved, 'es', 'es'),
  lookup: practiceLookup,
  buildSheet,
  // The page the table was read from: levantarse's is on levantar's page.
  sourcePage: (table) => table.meta.page ?? table.lemma,
  kindOf,
  isComplete,
  spellingHint: 'Check the spelling, including accents (á, é, í, ó, ú, ñ).',
};
