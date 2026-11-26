import { frenchPractice } from './fr';
import type { PracticeLanguage } from './types';

/**
 * The languages that can be practised. To add one, add a folder like ./fr
 * that exports a PracticeLanguage, list it here, and fetch its tables with
 * `npm run verbs:fetch -- <code>`. With more than one, a language picker
 * appears beside the search box.
 */
export const PRACTICE_LANGUAGES: readonly PracticeLanguage[] = [frenchPractice];

export const defaultPracticeLanguage: PracticeLanguage = frenchPractice;

export function getPracticeLanguage(code: string): PracticeLanguage | undefined {
  return PRACTICE_LANGUAGES.find((l) => l.code === code);
}
