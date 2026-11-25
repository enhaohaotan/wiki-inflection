import type { Inflection, InflectionTable } from '../../../core/types';
import { cleanText, formOfTags } from '../../../wiktionary/page';

/**
 * Extracts a Danish noun declension. Each "Declension" section has a table
 * whose corner cell names the gender:
 *
 *   neuter gender   singular             plural
 *                   indefinite definite  indefinite definite
 *   nominative      hus        huset     huse       husene
 *   genitive        hus'       husets    huses      husenes
 *
 * Every form is tagged ("def|nom|s-form-of"). Uncountable nouns (kaffe)
 * have no plural columns.
 */

export type DanishGender = 'common' | 'neuter';

function genderOf(table: Element): DanishGender | undefined {
  const corner = cleanText(table.querySelector('th')).toLowerCase();
  if (corner.includes('neuter')) return 'neuter';
  if (corner.includes('common')) return 'common';
  return undefined;
}

/** The declension in one "Declension" section, or null if it has none. */
export function parseDanishDeclension(declension: Element, pageTitle: string): InflectionTable | null {
  const table = declension.querySelector('table.inflection-table');
  if (!table) return null;

  const bySlot = new Map<string, Inflection>();
  for (const el of Array.from(table.querySelectorAll('.form-of'))) {
    const tags = formOfTags(el);
    const text = cleanText(el);
    if (!tags || !text || /^[-–—]$/.test(text)) continue;
    const key = [...tags].sort().join('|');
    const slot = bySlot.get(key) ?? { tags, forms: [], ipa: [] };
    if (!slot.forms.includes(text)) slot.forms.push(text);
    bySlot.set(key, slot);
  }
  const inflections = [...bySlot.values()];
  if (inflections.length === 0) return null;

  const meta: Record<string, string> = {};
  const gender = genderOf(table);
  if (gender) meta.gender = gender;

  const singular = inflections.find((i) => ['indef', 'nom', 's'].every((t) => i.tags.includes(t)));
  const lemma = singular?.forms[0] ?? pageTitle;
  return {
    lang: 'da',
    pos: 'noun',
    lemma,
    title: `Declension of ${lemma}`,
    inflections,
    periphrastic: [],
    notes: [],
    meta,
  };
}
