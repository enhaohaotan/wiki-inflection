import { germanPractice } from './de';
import { spanishPractice } from './es';
import { frenchPractice } from './fr';
import { italianPractice } from './it';
import type { PracticeLanguage } from './types';

/**
 * The languages that can be practised, in the order of the language picker.
 * To add one, add a folder like ./fr that exports a PracticeLanguage, list it
 * here, and fetch its tables with `npm run verbs:fetch -- <code>`. A language
 * can be listed before it is ready (`ready: false`): its verbs are shown on
 * its home page, but cannot be practised yet.
 */
export const PRACTICE_LANGUAGES: readonly PracticeLanguage[] = [
  frenchPractice,
  germanPractice,
  spanishPractice,
  italianPractice,
];

export const defaultPracticeLanguage: PracticeLanguage = frenchPractice;

export function getPracticeLanguage(code: string): PracticeLanguage | undefined {
  return PRACTICE_LANGUAGES.find((l) => l.code === code);
}
