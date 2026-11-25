import type { InflectionTable } from '../../../core/types';
import { cleanText } from '../../../wiktionary/page';

/**
 * Extracts the comparison of a Danish adverb from its headword line, the
 * same way as for adjectives (by the italic labels; the forms are untagged):
 *
 *   gerne (comparative hellere, superlative helst)
 *
 * Adverbs without comparison (meget, hurtigt) give nothing.
 */
export function parseDanishAdverb(adverb: Element, pageTitle: string): InflectionTable | null {
  const line = adverb.querySelector('.headword-line');
  if (!line) return null;

  const lemma = cleanText(line.querySelector('strong.headword')) || pageTitle;
  const comparative: string[] = [];
  const superlative: string[] = [];
  let into: string[] | null = null;
  for (const node of Array.from(line.children)) {
    if (node.tagName === 'I') {
      const label = cleanText(node).toLowerCase();
      if (label === 'or') continue; // a variant of the same form
      into = /superlative/.test(label) ? superlative : /comparative/.test(label) ? comparative : null;
    } else if (node.tagName === 'B' && into) {
      const form = cleanText(node);
      if (form && !into.includes(form)) into.push(form);
    }
  }
  if (comparative.length === 0 && superlative.length === 0) return null;

  return {
    lang: 'da',
    pos: 'adverb',
    lemma,
    title: `Comparison of ${lemma}`,
    inflections: [
      { tags: ['positive'], forms: [lemma], ipa: [] },
      ...(comparative.length ? [{ tags: ['comparative'], forms: comparative, ipa: [] }] : []),
      ...(superlative.length ? [{ tags: ['superlative'], forms: superlative, ipa: [] }] : []),
    ],
    periphrastic: [],
    notes: [],
    meta: {},
  };
}
