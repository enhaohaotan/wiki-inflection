import { savedTables, type StoredTable } from '../saved';
import type { PracticeLanguage } from '../types';
import saved from './data/verbTables.json?raw';
import { kindOf } from './kinds';
import { practiceLookup } from './lookup';
import { buildSheet } from './sheet';
import { KEY_VERBS, PRACTICE_VERBS } from './verbs';

/** Whether a table has what the sheet needs: the present, the past participle and the auxiliary. */
function isComplete(table: StoredTable): boolean {
  const has = (tags: string) => table.inflections.some((i) => i.tags.join('|') === tags && i.forms.length > 0);
  return has('1|s|pres|ind') || has('3|s|pres|ind') ? has('past|part') && has('aux') : false;
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
  savedTable: savedTables(saved, 'it', 'it'),
  lookup: practiceLookup,
  buildSheet,
  // The page the table was read from: chiamarsi has its own; alzarsi is built from alzare's.
  sourcePage: (table) => table.meta.page ?? table.lemma,
  kindOf,
  isComplete,
  spellingHint: 'Check the spelling, including the accent on a final vowel (parlò, sarà, è).',
};
