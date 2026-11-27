import type { Inflection, InflectionTable } from '../../../core/types';

/**
 * Reflexive verbs (levantarse). Wiktionary usually gives their tables, on a
 * page of their own or on the plain verb's (lavarse on lavar's). When it
 * has none, the table is built from the plain verb's: the pronoun before the
 * verb (me levanto), and attached to the imperative and the gerund with the
 * accent the longer word needs (levántate, levantémonos, levantándose).
 */

export function isReflexive(verb: string): boolean {
  return /(?:ar|er|ir|ír)se$/.test(verb);
}

/** "levantarse" -> "levantar", "reírse" -> "reír". */
export function plainVerb(verb: string): string {
  return isReflexive(verb) ? verb.slice(0, -2) : verb;
}

export const REFLEXIVE_PRONOUNS: Record<string, string> = { '1s': 'me', '2s': 'te', '3s': 'se', '1p': 'nos', '2p': 'os', '3p': 'se' };

const ACCENTED: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
const STRONG = /[aeoáéó]/;

/**
 * The vowel groups of a word, one per syllable, as [start, end) indices:
 * "levanta" -> le|van|ta, "sienta" -> sien|ta. The u of que, qui, gue, gui
 * is silent and not a vowel. Two strong vowels (a, e, o) are two syllables.
 */
function nuclei(word: string): [number, number][] {
  const result: [number, number][] = [];
  let i = 0;
  while (i < word.length) {
    const silentU = word[i] === 'u' && /[qg]/.test(word[i - 1] ?? '') && /[eiéí]/.test(word[i + 1] ?? '');
    if (!/[aeiouáéíóúü]/.test(word[i]!) || silentU) {
      i++;
      continue;
    }
    let end = i + 1;
    while (end < word.length && /[aeiouáéíóúü]/.test(word[end]!) && !(STRONG.test(word[end - 1]!) && STRONG.test(word[end]!))) end++;
    result.push([i, end]);
    i = end;
  }
  return result;
}

/**
 * Adds an unstressed word to the end of a verb form, writing the accent the
 * stress now needs: levanta + te -> levántate, levantando + se ->
 * levantándose, but haz + te -> hazte. `stressFrom` is the form the stress is
 * judged on, when the end was cut off first (levantemo(s) + nos).
 */
export function attach(form: string, pronoun: string, stressFrom = form): string {
  if (/[áéíóú]/.test(form)) return form + pronoun;
  const groups = nuclei(stressFrom);
  // Unmarked, the stress is on the next-to-last syllable after a vowel, n or s, else on the last.
  const lastStressed = !/[aeiouns]$/.test(stressFrom);
  const stressed = lastStressed ? groups.at(-1) : groups.at(-2);
  if (!stressed) return form + pronoun;
  // The stress moves back a syllable or more: write it on the strong vowel of its group, else the last.
  if (lastStressed && nuclei(pronoun).length === 1) return form + pronoun;
  const [start, end] = stressed;
  const group = form.slice(start, end);
  let at = start + Array.from(group).findIndex((ch) => STRONG.test(ch));
  if (at < start) at = end - 1;
  return form.slice(0, at) + (ACCENTED[form[at]!] ?? form[at]!) + form.slice(at + 1) + pronoun;
}

/** The affirmative imperative with its pronoun: levántate, levántese, levantémonos, levantaos, levántense. */
function imperative(form: string, key: string): string {
  if (key === '1p') return attach(form.slice(0, -1), 'nos', form);
  if (key === '2p') return form.endsWith('id') ? `${form.slice(0, -2)}íos` : `${form.slice(0, -1)}os`;
  return attach(form, REFLEXIVE_PRONOUNS[key]!);
}

function reflexiveForms(slot: Inflection): string[] | undefined {
  const [person, num, ...rest] = slot.tags;
  const key = `${person}${num}`;
  if (rest[0] === 'imp') return slot.forms.map((f) => imperative(f, key));
  const pronoun = REFLEXIVE_PRONOUNS[key];
  return pronoun ? slot.forms.map((f) => `${pronoun} ${f}`) : undefined;
}

export function reflexiveTable(plain: InflectionTable, verb: string): InflectionTable {
  const inflections: Inflection[] = [{ tags: ['inf'], forms: [verb], ipa: [] }];
  for (const slot of plain.inflections) {
    const tags = slot.tags.join('|');
    if (tags === 'ger') inflections.push({ tags: slot.tags, forms: slot.forms.map((f) => attach(f, 'se')), ipa: [] });
    else if (slot.tags[0] === 'past') inflections.push(slot);
    else if (/^[123]\|[sp]\|/.test(tags)) {
      const forms = reflexiveForms(slot);
      if (forms?.length) inflections.push({ tags: slot.tags, forms, ipa: [] });
    }
  }
  return { ...plain, lemma: verb, title: `Conjugation of ${verb}`, inflections };
}

/** A form without the pronoun before it, to match a lookup of the bare form: "me llamo" -> "llamo". */
export function withoutReflexive(form: string): string {
  return form.replace(/^(?:me|te|se|nos|os) /, '');
}
