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
  return (has('1|s|pres') || has('3|s|pres')) && has('past|part');
}

export const germanPractice: PracticeLanguage = {
  code: 'de',
  name: 'German',
  ownName: 'Deutsch',
  placeholder: 'Verb',
  flag: ['#000000', '#dd0000', '#ffce00'],
  locale: 'de',
  ready: true,
  verbs: PRACTICE_VERBS,
  keyVerbs: KEY_VERBS,
  savedTable: savedTables(saved, 'de', 'de'),
  lookup: practiceLookup,
  buildSheet,
  // A reflexive verb's table is built from the plain verb's page (sich freuen: freuen).
  sourcePage: (table) => table.meta.page ?? table.lemma,
  kindOf,
  isComplete,
  spellingHint: 'Check the spelling, including umlauts (ä, ö, ü) and ß.',
};
