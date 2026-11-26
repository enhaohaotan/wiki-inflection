import type { Inflection, InflectionTable } from '../../../core/types';
import { cleanText, formOfTags } from '../../../wiktionary/page';
import { textWithoutNotes as text, verbTable } from '../../verbTables';

/**
 * Extracts German verb conjugation tables from the German section of a page.
 *
 * A conjugation comes as up to three tables in one box headed, e.g.,
 * "Conjugation of anfangen (class 7 strong, auxiliary haben or sein)": the
 * simple forms, each tagged with its grammar (ich <fange an: 1|s|pres>); for
 * a separable verb, its forms in a subordinate clause (dass ich anfange);
 * and the compound tenses, written out untagged. Only the first is read:
 * the compound tenses are built from it like those of other languages.
 */

function parseInflections(table: Element): Inflection[] {
  const bySlot = new Map<string, Inflection>();
  for (const span of Array.from(table.querySelectorAll('span.form-of'))) {
    const tags = formOfTags(span);
    const form = text(span);
    if (!tags || !form) continue;
    const key = tags.join('|');
    const slot = bySlot.get(key) ?? { tags, forms: [], ipa: [] };
    bySlot.set(key, slot);
    if (!slot.forms.includes(form)) slot.forms.push(form);
  }

  // The auxiliary is plain text: "haben", "sein", "haben or sein". One with
  // a footnote is used only in some regions or registers (anfangen: sein,
  // "Northwest German colloquial"); it is kept apart, as aux|rare.
  for (const row of Array.from(table.querySelectorAll('tr'))) {
    const header = row.querySelector('th');
    const cell = row.querySelector('td');
    if (!header || !cell || text(header).toLowerCase() !== 'auxiliary') continue;
    for (const span of Array.from(cell.querySelectorAll('span'))) {
      const auxiliary = text(span);
      if (auxiliary !== 'haben' && auxiliary !== 'sein') continue;
      const tags = span.nextElementSibling?.tagName === 'SUP' ? ['aux', 'rare'] : ['aux'];
      const key = tags.join('|');
      const slot = bySlot.get(key) ?? { tags, forms: [], ipa: [] };
      bySlot.set(key, slot);
      if (!slot.forms.includes(auxiliary)) slot.forms.push(auxiliary);
    }
  }
  return [...bySlot.values()];
}

export function parseGermanVerbTables(section: Element, pageTitle: string): InflectionTable[] {
  return Array.from(section.querySelectorAll('table.inflection-table-de')).flatMap((table) => {
    // Only the simple forms' table has the infinitive and the present.
    const heading = cleanText(table.closest('.inflection-box'));
    const isPresent = (i: Inflection) => i.tags.join('|') === '1|s|pres';
    return verbTable('de', parseInflections(table), pageTitle, heading, isPresent) ?? [];
  });
}
