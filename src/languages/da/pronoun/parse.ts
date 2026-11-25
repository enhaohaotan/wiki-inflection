import type { Inflection, InflectionTable } from '../../../core/types';
import { cleanText } from '../../../wiktionary/page';

/**
 * Danish pronouns come in two shapes on Wiktionary.
 *
 * 1. Personal pronouns (jeg, mig, min, vi, os, ...): the pages carry one
 *    shared table of all of them, untagged and with merged cells:
 *
 *      Number Person Type | Nominative Oblique | Possessive (common neuter plural)
 *      Singular First  –  | jeg        mig     | min mit mine
 *      Plural   First modern | vi (2 rows) os  | vores (3 cols)
 *               archaic      |                 | vor vort vore
 *
 *    It is read as a grid, expanding rowspan/colspan, and kept row by row.
 *
 * 2. Other pronouns (denne, hvilken, nogen) list their gender/number forms
 *    in the headword line, like adjectives: "denne (neuter dette, plural disse)".
 */

export const PERSONAL_TITLE = 'Danish personal pronouns';

/** One row of the personal pronoun table. */
export interface PersonalRow {
  number: 'singular' | 'plural';
  /** Wiktionary's type column when it says something: formal, archaic, reflexive, ... */
  note?: 'formal' | 'archaic' | 'reflexive';
  nominative: string | null;
  oblique: string | null;
  /** One form, or three (common, neuter, plural). */
  possessive: string[];
}

interface Cell {
  el: Element;
  text: string;
}

/** The table as a matrix of cells, with merged cells repeated in every slot they cover. */
function expand(table: Element): (Cell | undefined)[][] {
  const grid: (Cell | undefined)[][] = [];
  Array.from(table.querySelectorAll('tr')).forEach((tr, r) => {
    grid[r] ??= [];
    let c = 0;
    for (const el of Array.from(tr.children)) {
      while (grid[r]![c]) c++;
      const rows = Number(el.getAttribute('rowspan') ?? 1);
      const cols = Number(el.getAttribute('colspan') ?? 1);
      const cell = { el, text: cleanText(el) };
      for (let dr = 0; dr < rows; dr++) {
        grid[r + dr] ??= [];
        for (let dc = 0; dc < cols; dc++) grid[r + dr]![c + dc] = cell;
      }
      c += cols;
    }
  });
  return grid;
}

const isForm = (cell: Cell | undefined) =>
  !!cell && cell.el.tagName === 'TD' && cell.text !== '' && !/^[-–—]$/.test(cell.text);

function noteOf(type: string): PersonalRow['note'] {
  const t = type.toLowerCase();
  if (t.includes('reflexive')) return 'reflexive';
  if (t.includes('archaic')) return 'archaic';
  // "formal (uncommon)" is De; "modern / informal" (du) must not match it.
  if (/\bformal\b/.test(t) && !/\binformal\b/.test(t)) return 'formal';
  return undefined;
}

/** The shared personal pronoun table, if this Danish section has it. */
export function findPersonalTable(section: Element): Element | null {
  return (
    Array.from(section.querySelectorAll('table.inflection-table')).find((t) => {
      const head = cleanText(t.querySelector('tr')).toLowerCase();
      return head.includes('nominative') && head.includes('possessive');
    }) ?? null
  );
}

export function parsePersonalRows(table: Element): PersonalRow[] {
  const grid = expand(table);
  const rows: PersonalRow[] = [];
  // Columns: 0 number, 1 person, 2 type, 3 nominative, 4 oblique, 5-7 possessive.
  grid.slice(2).forEach((row, i) => {
    const above = grid[i + 1] ?? [];
    // A cell merged down from the row above belongs to that row, not this one.
    const own = (c: number) => (row[c] && row[c] !== above[c] && isForm(row[c]) ? row[c]!.text : null);
    const poss = [5, 6, 7].map((c) => (row[c] && row[c] !== above[c] && isForm(row[c]) ? row[c] : undefined));
    const possessive =
      poss[0] && poss[0] === poss[2]
        ? [poss[0].text] // one form across all three columns (hans, vores)
        : poss.filter((p): p is Cell => !!p).map((p) => p.text);
    const number = /plural/i.test(row[0]?.text ?? '') ? 'plural' : 'singular';
    const parsed: PersonalRow = {
      number,
      nominative: own(3),
      oblique: own(4),
      possessive,
    };
    const note = noteOf(row[2]?.text ?? '');
    if (note) parsed.note = note;
    if (parsed.nominative || parsed.oblique || parsed.possessive.length) rows.push(parsed);
  });
  return rows;
}

/** The personal pronoun table as an entry table, if it contains the page's word. */
export function parsePersonalTable(table: Element, pageTitle: string): InflectionTable | null {
  const rows = parsePersonalRows(table);
  const all = rows.flatMap((r) => [r.nominative, r.oblique, ...r.possessive]).filter((f): f is string => !!f);
  if (!all.includes(pageTitle)) return null;

  const inflections: Inflection[] = [];
  rows.forEach((r, i) => {
    const row = `row:${i}`;
    if (r.nominative) inflections.push({ tags: [row, 'nom'], forms: [r.nominative], ipa: [] });
    if (r.oblique) inflections.push({ tags: [row, 'obl'], forms: [r.oblique], ipa: [] });
    if (r.possessive.length) inflections.push({ tags: [row, 'poss'], forms: r.possessive, ipa: [] });
  });
  return {
    lang: 'da',
    pos: 'pronoun',
    lemma: pageTitle,
    title: PERSONAL_TITLE,
    inflections,
    periphrastic: [],
    notes: [],
    // Row metadata the view needs (number, notes); kept as JSON as meta is string-valued.
    meta: { kind: 'personal', rows: JSON.stringify(rows.map((r) => ({ number: r.number, note: r.note }))) },
  };
}

/** A non-personal pronoun from its headword line: "denne (neuter dette, plural disse)". */
export function parsePronounHeadword(pronoun: Element, pageTitle: string): InflectionTable | null {
  const line = pronoun.querySelector('.headword-line');
  if (!line) return null;
  // "en or én": the headword can carry a variant; the first word is the lemma.
  const lemma = cleanText(line.querySelector('strong.headword')).split(/\s+or\s+/)[0] || pageTitle;

  const slots: Record<'common' | 'neuter' | 'plural', string[]> = { common: [lemma], neuter: [], plural: [] };
  let into: (keyof typeof slots)[] = [];
  for (const node of Array.from(line.children)) {
    if (node.tagName === 'I') {
      const label = cleanText(node).toLowerCase();
      // "plural nogle or nogen": "or" adds a variant to the same slot.
      if (label === 'or') continue;
      into = [];
      if (/neuter/.test(label)) into.push('neuter');
      if (/plural/.test(label)) into.push('plural');
    } else if (node.tagName === 'B') {
      const form = cleanText(node);
      for (const s of into) if (form && !slots[s].includes(form)) slots[s].push(form);
    }
  }
  if (slots.neuter.length === 0 && slots.plural.length === 0) return null;

  return {
    lang: 'da',
    pos: 'pronoun',
    lemma,
    title: `Inflection of ${lemma}`,
    inflections: (Object.keys(slots) as (keyof typeof slots)[])
      .filter((s) => slots[s].length)
      .map((s) => ({ tags: [s], forms: slots[s], ipa: [] })),
    periphrastic: [],
    notes: [],
    meta: { kind: 'gendered' },
  };
}
