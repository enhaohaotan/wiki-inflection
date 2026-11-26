import type { Inflection, InflectionTable } from '../../../core/types';
import { cleanText } from '../../../wiktionary/page';

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

const TAG_SUFFIX = '-form-of';

/** Grammar tags from a form's class, e.g. "1|s|sub:II-form-of" -> ["1", "s", "sub:II"]. */
function tagsOf(span: Element): string[] | null {
  for (const cls of Array.from(span.classList)) {
    if (cls !== 'form-of' && cls.endsWith(TAG_SUFFIX)) return cls.slice(0, -TAG_SUFFIX.length).split('|');
  }
  return null;
}

function text(node: Element): string {
  const clone = node.cloneNode(true) as Element;
  clone.querySelectorAll('sup').forEach((el) => el.remove());
  return cleanText(clone);
}

function parseInflections(table: Element): Inflection[] {
  const bySlot = new Map<string, Inflection>();
  for (const span of Array.from(table.querySelectorAll('span.form-of'))) {
    const tags = tagsOf(span);
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

/** "Conjugation of anfangen (class 7 strong, auxiliary haben or sein)" -> "class 7 strong". */
function verbClass(box: Element | null): string {
  const heading = /Conjugation of [^(]*\(([^)]*)\)/.exec(cleanText(box))?.[1] ?? '';
  return heading
    .split(/,\s*/)
    .filter((part) => !part.startsWith('auxiliary'))
    .join(', ');
}

export function parseGermanVerbTables(section: Element, pageTitle: string): InflectionTable[] {
  const tables: InflectionTable[] = [];
  for (const table of Array.from(section.querySelectorAll('table.inflection-table-de'))) {
    const inflections = parseInflections(table);
    // The simple forms' table: with the infinitive and the present.
    const lemma = inflections.find((i) => i.tags.join('|') === 'inf')?.forms[0];
    if (!lemma || !inflections.some((i) => i.tags.join('|') === '1|s|pres')) continue;

    const meta: Record<string, string> = { page: pageTitle };
    const verbClassNote = verbClass(table.closest('.inflection-box'));
    if (verbClassNote) meta.class = verbClassNote;

    tables.push({
      lang: 'de',
      pos: 'verb',
      lemma,
      title: `Conjugation of ${lemma}`,
      inflections,
      periphrastic: [],
      notes: [],
      meta,
    });
  }
  return tables;
}
