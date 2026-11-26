import type { Inflection, InflectionTable } from '../../../core/types';

/**
 * Reflexive verbs (sich freuen). Wiktionary conjugates only the plain verb
 * (freuen), so the reflexive verb's table is built from it: the pronoun
 * right after the verb (freue mich, ruhe mich aus), haben as the auxiliary.
 * The pronoun is the accusative one (mich, dich), as the listed verbs take.
 */

export function isReflexive(verb: string): boolean {
  return verb.startsWith('sich ');
}

/** "sich freuen" -> "freuen". */
export function plainVerb(verb: string): string {
  return verb.replace(/^sich /, '');
}

export const REFLEXIVE_PRONOUNS: Record<string, string> = {
  '1s': 'mich',
  '2s': 'dich',
  '3s': 'sich',
  '1p': 'uns',
  '2p': 'euch',
  '3p': 'sich',
};

/** "ruhe aus" + "mich" -> "ruhe mich aus". */
export function withPronoun(form: string, pronoun: string): string {
  const [verb, ...rest] = form.split(' ');
  return [verb, pronoun, ...rest].join(' ');
}

function pronounFor(tags: string[]): string | undefined {
  return /^[123]$/.test(tags[0] ?? '') ? REFLEXIVE_PRONOUNS[`${tags[0]}${tags[1]}`] : undefined;
}

export function reflexiveTable(plain: InflectionTable, verb: string): InflectionTable {
  const inflections: Inflection[] = [{ tags: ['aux'], forms: ['haben'], ipa: [] }];
  for (const slot of plain.inflections) {
    if (slot.tags[0] === 'aux') continue;
    const pronoun = pronounFor(slot.tags);
    inflections.push(pronoun ? { ...slot, forms: slot.forms.map((f) => withPronoun(f, pronoun)) } : slot);
  }
  return { ...plain, lemma: verb, title: `Conjugation of ${verb}`, inflections };
}
