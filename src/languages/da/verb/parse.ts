import type { Inflection, InflectionTable } from '../../../core/types';
import { cleanText, formOfTags } from '../../../wiktionary/page';

/**
 * Extracts Danish verb conjugations. Each "Conjugation" section holds two
 * tables:
 *
 *               active    passive          participle
 *   infinitive  spise     spises     present  spisende
 *   present     spiser    spises     past     (have / havde) spist
 *   past        spiste    spistes    gerund   —
 *   imperative  spis      —
 *
 * Most forms carry grammar tags ("pres|act-form-of"); a few don't (være's
 * "er"), so those are tagged from their row and column instead.
 */

const ROW_TAGS: Record<string, string[]> = {
  infinitive: ['inf'],
  present: ['pres'],
  past: ['past'],
  imperative: ['imp'],
};
const COLUMN_TAGS: Record<string, string> = { active: 'act', passive: 'pass' };
const PARTICIPLE_TAGS: Record<string, string[]> = {
  present: ['pres', 'part'],
  past: ['past', 'part'],
  gerund: ['ger'],
};

/** Missing forms are written as a dash. */
const isDash = (text: string) => /^[-–—]$/.test(text);

/** Forms in a cell, tagged by Wiktionary or else by `fallback`. */
function cellForms(cell: Element, fallback: string[] | null): Inflection[] {
  const tagged = Array.from(cell.querySelectorAll('.form-of'));
  if (tagged.length > 0) {
    const bySlot = new Map<string, Inflection>();
    for (const el of tagged) {
      const tags = formOfTags(el);
      const text = cleanText(el);
      if (!tags || !text || isDash(text)) continue;
      const key = [...tags].sort().join('|');
      const slot = bySlot.get(key) ?? { tags, forms: [], ipa: [] };
      if (!slot.forms.includes(text)) slot.forms.push(text);
      bySlot.set(key, slot);
    }
    return [...bySlot.values()];
  }
  if (!fallback) return [];
  const forms = Array.from(cell.querySelectorAll(':scope > .Latn, :scope > a'))
    .map(cleanText)
    .filter((t) => t && !isDash(t));
  return forms.length > 0 ? [{ tags: fallback, forms: [...new Set(forms)], ipa: [] }] : [];
}

function rowLabel(row: Element): string {
  return cleanText(row.querySelector('th')).toLowerCase();
}

function parseVoiceTable(table: Element): Inflection[] {
  const rows = Array.from(table.querySelectorAll('tr'));
  const columns = Array.from(rows[0]?.querySelectorAll('th') ?? [])
    .slice(1)
    .map((th) => COLUMN_TAGS[cleanText(th).toLowerCase()] ?? null);
  const result: Inflection[] = [];
  for (const row of rows.slice(1)) {
    const rowTags = ROW_TAGS[rowLabel(row)] ?? null;
    Array.from(row.querySelectorAll('td')).forEach((cell, i) => {
      const column = columns[i];
      result.push(...cellForms(cell, rowTags && column ? [...rowTags, column] : null));
    });
  }
  return result;
}

function parseParticipleTable(table: Element, meta: Record<string, string>): Inflection[] {
  const result: Inflection[] = [];
  for (const row of Array.from(table.querySelectorAll('tr')).slice(1)) {
    const label = rowLabel(row);
    const cell = row.querySelector('td');
    if (!cell) continue;
    if (label === 'past') {
      // "(have / havde) spist": the auxiliary used with the past participle.
      const auxiliary = Array.from(cell.querySelectorAll('.Latn:not(.form-of)'))
        .filter((el) => !el.closest('.form-of') && !el.querySelector('.form-of'))
        .map(cleanText)
        .filter(Boolean);
      const unique = [...new Set(auxiliary)];
      if (unique.length > 0) meta.auxiliary = unique.join(' / ');
    }
    result.push(...cellForms(cell, PARTICIPLE_TAGS[label] ?? null));
  }
  return result;
}

function headingText(section: Element): string {
  const first = section.firstElementChild;
  return first && /^H[1-6]$/.test(first.tagName) ? cleanText(first) : '';
}

/** The conjugation in one "Conjugation" section, or null if it has none. */
export function parseDanishConjugation(conjugation: Element, pageTitle: string): InflectionTable | null {
  const meta: Record<string, string> = {};
  const inflections: Inflection[] = [];
  for (const table of Array.from(conjugation.querySelectorAll('table.inflection-table'))) {
    const header = cleanText(table.querySelector('tr')).toLowerCase();
    if (header.includes('active')) inflections.push(...parseVoiceTable(table));
    else if (header.includes('participle')) inflections.push(...parseParticipleTable(table, meta));
  }
  if (inflections.length === 0) return null;

  const infinitive = inflections.find((i) => i.tags.includes('inf') && i.tags.includes('act'))?.forms[0];
  const lemma = infinitive ?? pageTitle;
  return {
    lang: 'da',
    pos: 'verb',
    lemma,
    title: `Conjugation of ${lemma}`,
    inflections,
    periphrastic: [],
    notes: [],
    meta,
  };
}

export function parseDanishVerbTables(section: Element, pageTitle: string): InflectionTable[] {
  return Array.from(section.querySelectorAll('section'))
    .filter((s) => /^Conjugation\b/.test(headingText(s)))
    .map((s) => parseDanishConjugation(s, pageTitle))
    .filter((t): t is InflectionTable => t !== null);
}
