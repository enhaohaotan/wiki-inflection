import { spanishPractice } from './es';
import { frenchPractice } from './fr';
import { italianPractice } from './it';
import type { PracticeLanguage } from './types';
import { germanPractice } from './upcoming';

/**
 * The languages that can be practised, in the order of the language picker.
 * To add one, add a folder like ./fr that exports a PracticeLanguage, list it
 * here, and fetch its tables with `npm run verbs:fetch -- <code>`. Languages
 * not ready yet are in ./upcoming.ts: their verbs are listed, but cannot be practised.
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
