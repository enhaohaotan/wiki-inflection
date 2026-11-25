import type { InflectionTable } from '../../../core/types';
import { cleanText } from '../../../wiktionary/page';

/**
 * Danish numerals come from two places:
 *
 * 1. Each numeral's page has a "Danish numbers" box: the value, then the
 *    cardinal and ordinal after italic labels.
 *      ← 24 | 25 | 26 →
 *      Cardinal: femogtyve   Ordinal: femogtyvende
 *
 * 2. "Appendix:Danish numerals" lists 0–19, the tens and the large numbers,
 *    used here as one table of them all. Rare forms (banking "toti", in a
 *    <p> with a footnote) are left out.
 */

export const APPENDIX_TITLE = 'Appendix:Danish numerals';

export interface NumeralRow {
  value: string;
  cardinal: string[];
  ordinal: string[];
}

export interface NumeralGroup {
  /** "Små tal" (0–19), "Tiere" (the tens) or "Store tal" (large numbers). */
  title: string;
  rows: NumeralRow[];
}

/** Forms in a cell, leaving out rare ones set apart in a paragraph. */
function formsIn(cell: Element | undefined): string[] {
  if (!cell) return [];
  const forms = Array.from(cell.querySelectorAll('.Latn'))
    .filter((el) => !el.closest('p'))
    .map(cleanText)
    .filter(Boolean);
  return [...new Set(forms)];
}

/** "10000 (104)" -> "10000". */
const valueOf = (text: string) => text.split(/\s/)[0] ?? text;

/** The numeral box on a numeral's own page, if there is one. */
export function parseNumberBox(section: Element): NumeralRow | null {
  const box = section.querySelector('table.number-box');
  if (!box) return null;
  const value = cleanText(box.querySelector('.current-number'));
  const row: NumeralRow = { value, cardinal: [], ordinal: [] };
  let into: string[] | null = null;
  for (const cell of Array.from(box.querySelectorAll('td'))) {
    for (const node of Array.from(cell.children)) {
      if (node.tagName === 'I') {
        const label = cleanText(node).toLowerCase();
        into = label === 'cardinal' ? row.cardinal : label === 'ordinal' ? row.ordinal : null;
      } else if (node.matches('.Latn') && into) {
        const form = cleanText(node);
        if (form && !into.includes(form)) into.push(form);
      } else if (node.tagName === 'BR') {
        into = null;
      }
    }
  }
  return value && (row.cardinal.length || row.ordinal.length) ? row : null;
}

/** The appendix's tables of numbers, grouped as 0–19, tens and large numbers. */
export function parseNumeralAppendix(doc: Document): NumeralGroup[] {
  // The tables sit inside a layout table; take only the innermost ones.
  const tables = Array.from(doc.querySelectorAll('table')).filter(
    (t) => !t.querySelector('table') && /cardinal number/i.test(cleanText(t)),
  );
  const seen = new Set<string>();
  const groups: NumeralGroup[] = [];
  tables.forEach((table) => {
    const rows: NumeralRow[] = [];
    for (const tr of Array.from(table.querySelectorAll('tr'))) {
      const cells = Array.from(tr.children);
      const value = valueOf(cleanText(cells[0]));
      if (!/^\d+$/.test(value) || seen.has(value)) continue;
      const cardinal = formsIn(cells[1]);
      if (cardinal.length === 0) continue;
      seen.add(value);
      rows.push({ value, cardinal, ordinal: formsIn(cells[2]) });
    }
    if (rows.length === 0) return;
    const first = Number(rows[0]!.value);
    const title = first >= 100 ? 'Store tal' : rows.some((r) => r.value === '20') ? 'Tiere' : 'Små tal';
    // 0–9 and 10–19 come as two tables: keep them as one group.
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.rows.push(...rows);
    else groups.push({ title, rows });
  });
  return groups;
}

/** The numeral's own table: its value, cardinal and ordinal. */
export function numeralTable(row: NumeralRow, lemma: string): InflectionTable {
  return {
    lang: 'da',
    pos: 'numeral',
    lemma,
    title: `Numeral ${lemma}`,
    inflections: [
      ...(row.value ? [{ tags: ['value'], forms: [row.value], ipa: [] }] : []),
      ...(row.cardinal.length ? [{ tags: ['cardinal'], forms: row.cardinal, ipa: [] }] : []),
      ...(row.ordinal.length ? [{ tags: ['ordinal'], forms: row.ordinal, ipa: [] }] : []),
    ],
    periphrastic: [],
    notes: [],
    meta: {},
  };
}

/** Danish words for 0–100, so a number typed as digits can be looked up. */
const UNITS = ['nul', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni'];
const TEENS = ['ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten'];
const TENS = ['', '', 'tyve', 'tredive', 'fyrre', 'halvtreds', 'tres', 'halvfjerds', 'firs', 'halvfems'];

/**
 * "25" -> "femogtyve": the unit, "og", then the tens. Null outside 0–100.
 * Uses the forms of the appendix (en, tyve, halvtreds, ...).
 */
export function danishNumberWord(digits: string): string | null {
  if (!/^\d{1,3}$/.test(digits)) return null;
  const n = Number(digits);
  if (n > 100) return null;
  if (n === 100) return 'hundrede';
  if (n < 10) return UNITS[n]!;
  if (n < 20) return TEENS[n - 10]!;
  const unit = n % 10;
  const tens = TENS[Math.floor(n / 10)]!;
  return unit === 0 ? tens : `${UNITS[unit]}og${tens}`;
}

/**
 * Ordinals of 40–90 have a standard long form and a colloquial short one
 * (halvfjerdsindstyvende / halvfjerdsende). Puts the long, standard form
 * first; other lists keep Wiktionary's order (ellevte, elvte).
 */
export function standardFirst(ordinals: string[]): string[] {
  const long = ordinals.filter((o) => /tyvende$/.test(o));
  return [...long, ...ordinals.filter((o) => !long.includes(o))];
}

/** The reverse: the short ordinal first (halvtredsende / halvtredsindstyvende). */
export function shortFirst(ordinals: string[]): string[] {
  const long = ordinals.filter((o) => /tyvende$/.test(o));
  return [...ordinals.filter((o) => !long.includes(o)), ...long];
}

/**
 * Every numeral's forms by one rule, so that all of them look alike:
 * Wiktionary's numeral pages differ (some give a short ordinal, some none at
 * all), the appendix does not.
 *
 * - A number in the appendix: its row there, standard ordinal first
 *   (50 -> halvtreds; halvtredsindstyvende / halvtredsende).
 * - 21–99: the unit, "og", then the tens, for the cardinal and for each
 *   ordinal of the tens (88 -> otteogfirs; otteogfirsindstyvende / otteogfirsende).
 * - Anything else: null, and the page's own forms are used.
 */
export function numeralRow(value: string, groups: NumeralGroup[]): NumeralRow | null {
  const rows = groups.flatMap((g) => g.rows);
  const listed = rows.find((r) => r.value === value);
  if (listed) return { ...listed, ordinal: standardFirst(listed.ordinal) };

  const n = Number(value);
  if (!Number.isInteger(n) || n < 21 || n > 99 || n % 10 === 0) return null;
  const tens = rows.find((r) => r.value === String(n - (n % 10)));
  if (!tens || tens.ordinal.length === 0) return null;
  const unit = `${UNITS[n % 10]}og`;
  return {
    value,
    cardinal: tens.cardinal.map((c) => unit + c),
    ordinal: standardFirst(tens.ordinal).map((o) => unit + o),
  };
}

/** The reverse, for 0–100: "otteogfirs" -> "88". Null for any other word. */
export function danishNumberValue(word: string): string | null {
  const w = word.trim().toLocaleLowerCase('da');
  for (let n = 0; n <= 100; n++) if (danishNumberWord(String(n)) === w) return String(n);
  return null;
}
