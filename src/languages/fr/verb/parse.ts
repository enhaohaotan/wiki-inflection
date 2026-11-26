import type { Inflection, InflectionTable, PeriphrasticRule } from '../../../core/types';
import { cleanText } from '../../../wiktionary/page';

/**
 * Extracts French verb conjugation tables from the French section of a page.
 *
 * Wiktionary's table is laid out for wide screens, but every form cell is
 * marked up with its grammar, e.g.
 *
 *   <td><span class="Latn form-of lang-fr 1|s|pres|indc-form-of"><a>vais</a></span>
 *       <br><span><span class="IPA">/vɛ/</span></span></td>
 *
 * so forms are read by tag, never by row/column position.
 */

const TABLE_SELECTOR = 'table.roa-inflection-table';
const TAG_SUFFIX = '-form-of';

/** Grammar tags from a form's class, e.g. "1|s|pres|indc-form-of" -> ["1", "s", "pres", "indc"]. */
export function tagsOf(span: Element): string[] | null {
  for (const cls of Array.from(span.classList)) {
    if (cls !== 'form-of' && cls.endsWith(TAG_SUFFIX)) {
      return cls.slice(0, -TAG_SUFFIX.length).split('|');
    }
  }
  return null;
}

const PERSON_COLUMNS: [string, string][] = [
  ['1', 's'],
  ['2', 's'],
  ['3', 's'],
  ['1', 'p'],
  ['2', 'p'],
  ['3', 'p'],
];

/** Row label -> tags, for tables whose cells are not tagged (see below). */
const ROW_TAGS: Record<string, string[]> = {
  'nonfinite:present participle': ['ppr'],
  'nonfinite:past participle': ['pp'],
  'indicative:present': ['pres', 'indc'],
  'indicative:imperfect': ['impf', 'indc'],
  'indicative:past historic': ['phis'],
  'indicative:future': ['futr'],
  'indicative:conditional': ['cond'],
  'subjunctive:present': ['pres', 'subj'],
  'subjunctive:imperfect': ['impf', 'subj'],
  'imperative:simple': ['impr'],
};

function rowTagsOf(row: Element): string[] | null {
  const group = groupOf(row);
  for (const span of Array.from(row.querySelectorAll('th span[title]'))) {
    const tags = ROW_TAGS[`${group}:${cleanText(span).toLowerCase()}`];
    if (tags) return tags;
  }
  return null;
}

function parseInflections(table: Element): Inflection[] {
  const result: Inflection[] = [];
  for (const row of Array.from(table.querySelectorAll('tr'))) {
    const cells = Array.from(row.children).filter((c) => c.tagName === 'TD');
    let rowTags: string[] | null | undefined;

    cells.forEach((cell, column) => {
      const ipa = Array.from(cell.querySelectorAll('.IPA')).map(cleanText).filter(Boolean);
      const tagged = Array.from(cell.querySelectorAll('span.form-of'));

      if (tagged.length > 0) {
        // A cell holds one slot, but group by tags anyway rather than assume it.
        const bySlot = new Map<string, Inflection>();
        for (const span of tagged) {
          const tags = tagsOf(span);
          const text = cleanText(span);
          if (!tags || !text) continue;
          const key = tags.join('|');
          let slot = bySlot.get(key);
          if (!slot) {
            slot = { tags, forms: [], ipa };
            bySlot.set(key, slot);
          }
          if (!slot.forms.includes(text)) slot.forms.push(text);
        }
        result.push(...bySlot.values());
        return;
      }

      // Reflexive tables ("s'asseoir": m'assois, assieds-toi) wrap each form in
      // a plain span with no grammar tags, so fall back to the cell's position.
      const forms = Array.from(cell.querySelectorAll('span.Latn')).map(cleanText).filter(Boolean);
      if (forms.length === 0) return;
      if (rowTags === undefined) rowTags = rowTagsOf(row);
      if (!rowTags) return;
      if (cells.length === 1) {
        result.push({ tags: rowTags, forms: [...new Set(forms)], ipa });
      } else if (cells.length === PERSON_COLUMNS.length) {
        result.push({ tags: [...PERSON_COLUMNS[column]!, ...rowTags], forms: [...new Set(forms)], ipa });
      }
    });
  }
  return result;
}

/** The infinitive is plain text in the table (it is the page itself), so it has no tags. */
function parseInfinitive(table: Element): string {
  for (const row of Array.from(table.querySelectorAll('tr'))) {
    const header = row.querySelector('th');
    if (header && /^infinitive\b/i.test(cleanText(header))) {
      return cleanText(row.querySelector('td'));
    }
  }
  return '';
}

function groupOf(row: Element): string {
  for (const th of Array.from(row.querySelectorAll('th'))) {
    const m = /\broa-(indicative|subjunctive|imperative|nonfinite)-/.exec(th.className);
    if (m?.[1]) return m[1];
  }
  return 'other';
}

/** Compound tenses are given as a rule ("present indicative of être + past participle"). */
function parsePeriphrastic(table: Element): PeriphrasticRule[] {
  const rules: PeriphrasticRule[] = [];
  let nonfinite: { label: string; nativeLabel?: string } | null = null;

  for (const row of Array.from(table.querySelectorAll('tr'))) {
    const group = groupOf(row);

    // Non-finite forms span two rows (simple / compound); the name sits in the first.
    const spanning = row.querySelector('th.roa-nonfinite-header[rowspan]');
    if (spanning) {
      const named = spanning.querySelector('span[title]');
      nonfinite = {
        label: cleanText(named ?? spanning),
        nativeLabel: named?.getAttribute('title') || undefined,
      };
    }

    const ruleCell = row.querySelector('th.roa-compound-row');
    if (!ruleCell) continue;
    const rule = cleanText(ruleCell);

    if (group === 'nonfinite') {
      if (!nonfinite) continue;
      rules.push({ key: `nonfinite:${nonfinite.label}`, ...nonfinite, rule });
      continue;
    }

    const labels = Array.from(row.querySelectorAll('th:not(.roa-compound-row) span[title]'));
    const named = labels[labels.length - 1];
    if (!named) continue;
    const label = cleanText(named);
    rules.push({
      key: `${group}:${label}`,
      label,
      nativeLabel: named.getAttribute('title') || undefined,
      rule,
    });
  }
  return rules;
}

/** "Conjugation of aller (see also Appendix:French verbs)" -> "Conjugation of aller". */
function parseTitle(frame: Element | null): string {
  const head = frame?.querySelector('.NavHead');
  if (!head) return '';
  const clone = head.cloneNode(true) as Element;
  clone.querySelectorAll('span').forEach((s) => s.remove());
  return cleanText(clone);
}

/** Remarks the template prints above the table, e.g. on irregular stems. */
function parseNotes(frame: Element | null): string[] {
  const about = frame?.getAttribute('about');
  if (!frame || !about) return [];
  const notes: string[] = [];
  for (let el = frame.previousElementSibling; el; el = el.previousElementSibling) {
    if (el.getAttribute('about') !== about) break;
    if (el.tagName !== 'P') continue;
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll('style, link').forEach((s) => s.remove());
    const text = cleanText(clone);
    if (text) notes.unshift(text);
  }
  return notes;
}

export function parseFrenchVerbTables(section: Element, pageTitle: string): InflectionTable[] {
  const tables: InflectionTable[] = [];

  for (const table of Array.from(section.querySelectorAll(TABLE_SELECTOR))) {
    const inflections = parseInflections(table);
    if (inflections.length === 0) continue;

    const frame = table.closest('.NavFrame');
    const title = parseTitle(frame);
    const infinitive = parseInfinitive(table);
    const lemma = infinitive || /^Conjugation of (.+)$/.exec(title)?.[1] || pageTitle;
    inflections.unshift({ tags: ['inf'], forms: [lemma], ipa: [] });

    // The page it was read from, as for the other languages: credited on the practice page.
    const meta: Record<string, string> = { page: pageTitle };
    const auxiliary = cleanText(table.querySelector('th.roa-compound-row a'));
    if (auxiliary) meta.auxiliary = auxiliary;

    tables.push({
      lang: 'fr',
      pos: 'verb',
      lemma,
      title: title || `Conjugation of ${lemma}`,
      inflections,
      periphrastic: parsePeriphrastic(table),
      notes: parseNotes(frame),
      meta,
    });
  }
  return tables;
}
