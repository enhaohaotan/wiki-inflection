import type { Inflection } from '../../../core/types';
import { cleanText, headingPath } from '../../../wiktionary/page';
import { tagsOf } from './parse';

/**
 * Reads the agreed forms of a past participle from the participle's own page
 * (e.g. "allé" -> allée, allés, allées). The verb's conjugation table only
 * gives the masculine singular.
 *
 * Forms are tagged "f|s-form-of", "m|p-form-of", "f|p-form-of". The same page
 * often has an Adjective entry with the same forms; the Participle entry is
 * preferred, the Adjective one used only when there is no Participle entry.
 */

const AGREEMENT_TAGS = new Set(['f|s', 'm|p', 'f|p']);
const PREFERRED_HEADINGS = ['Participle', 'Adjective'];

export function parseParticipleForms(section: Element): Inflection[] {
  const byHeading = new Map<string, Map<string, Inflection>>();

  for (const span of Array.from(section.querySelectorAll('.form-of'))) {
    const tags = tagsOf(span);
    const text = cleanText(span);
    if (!tags || !text || !AGREEMENT_TAGS.has(tags.join('|'))) continue;

    const heading = headingPath(span, section).at(-1) ?? '';
    let group = byHeading.get(heading);
    if (!group) {
      group = new Map();
      byHeading.set(heading, group);
    }
    const key = tags.join('|');
    const slot = group.get(key) ?? { tags: ['pp', ...tags], forms: [], ipa: [] };
    if (!slot.forms.includes(text)) slot.forms.push(text);
    group.set(key, slot);
  }

  for (const heading of PREFERRED_HEADINGS) {
    const group = byHeading.get(heading);
    if (group) return [...group.values()];
  }
  return [];
}
