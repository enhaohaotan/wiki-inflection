import type { Inflection, InflectionTable, LanguageEntry } from '../../../core/types';
import type { SectionFetcher } from '../../registry';
import { cleanText, headingPath } from '../../../wiktionary/page';
import { auxiliariesInRule } from './auxiliaries';
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

/**
 * Whether a table lacks the agreed participle forms (allée, allés, allées)
 * its compound tenses with être need. They come from a second page, so a
 * lookup interrupted by Wiktionary's rate limit can return the table without
 * them; it is then fetched again rather than saved incomplete.
 */
export function lacksAgreement(table: {
  inflections: { tags: string[] }[];
  periphrastic: { key: string; rule: string }[];
}): boolean {
  const usesEtre = table.periphrastic.some(
    (p) => !p.key.startsWith('nonfinite') && auxiliariesInRule(p.rule).some((u) => u.auxiliary === 'être'),
  );
  const agreed = table.inflections.some((i) => i.tags[0] === 'pp' && i.tags.length === 3);
  return usesEtre && !agreed;
}

function pastParticiple(table: InflectionTable): string | undefined {
  return table.inflections.find((i) => i.tags.length === 1 && i.tags[0] === 'pp')?.forms[0];
}

/** Whether any compound tense uses être, where the participle agrees with the subject. */
function usesEtre(table: InflectionTable): boolean {
  return table.periphrastic.some((p) => auxiliariesInRule(p.rule).some((u) => u.auxiliary === 'être'));
}

/**
 * Adds the agreed forms of the past participle (allée, allés, allées) to the
 * tables whose compound tenses take être: the conjugation table only has the
 * masculine singular; the others are on the participle's own page.
 */
export async function enrichParticiples(entry: LanguageEntry, fetchSection: SectionFetcher): Promise<LanguageEntry> {
  const wanted = new Set(entry.tables.filter(usesEtre).map(pastParticiple).filter((p) => p !== undefined));
  if (wanted.size === 0) return entry;

  const forms = new Map<string, Inflection[]>();
  for (const participle of wanted) {
    const section = await fetchSection(participle);
    forms.set(participle, section ? parseParticipleForms(section) : []);
  }

  return {
    ...entry,
    tables: entry.tables.map((table) => {
      const extra = usesEtre(table) ? forms.get(pastParticiple(table) ?? '') : undefined;
      return extra?.length ? { ...table, inflections: [...table.inflections, ...extra] } : table;
    }),
  };
}
