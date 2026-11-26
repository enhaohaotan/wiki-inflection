import { conjugationLayout } from '../../languages/de/verb/layout';
import { hasForms } from '../conjugation';
import { savedTables, type StoredTable } from '../saved';
import type { PracticeLanguage } from '../types';
import { kindOf } from './kinds';
import { practiceLookup } from './lookup';
import { KEY_VERBS, PRACTICE_VERBS } from './verbs';

/** Whether a table has what the sheet needs: the present (only "regnet" for regnen) and the past participle. */
function isComplete(table: StoredTable): boolean {
  return hasForms(table, '3|s|pres', 'past|part');
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
  // A chunk of its own, downloaded when the language is first opened.
  ...savedTables(() => import('./data/verbTables.json?raw'), 'de', 'de'),
  lookup: practiceLookup,
  layout: conjugationLayout,
  // A reflexive verb's table is built from the plain verb's page (sich freuen: freuen).
  sourcePage: (table) => table.meta.page ?? table.lemma,
  kindOf,
  isComplete,
  spellingHint: 'Check the spelling, including umlauts (ä, ö, ü) and ß.',
};
