import type { Blank } from './types';

/** For comparing answers: case, apostrophes and spacing don't count; accents do. */
export function normalizeAnswer(text: string, locale: string): string {
  return text
    .normalize('NFC')
    .replace(/[’ʼ‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase(locale);
}

/** Whether `answer` is one of the accepted spellings. */
export function isCorrect(answer: string, blank: Blank, locale: string): boolean {
  const a = normalizeAnswer(answer, locale);
  return blank.accepted.some((form) => normalizeAnswer(form, locale) === a);
}
