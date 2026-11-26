import type { Inflection, InflectionTable } from '../../../core/types';
import { cleanText } from '../../../wiktionary/page';
import { label, PERSONS, verbTable, type Person } from '../../verbTables';

/**
 * Extracts Italian verb conjugation tables from the Italian section of a page.
 *
 * The table has the same layout for every verb, but only a plain verb's
 * forms carry grammar tags; a reflexive verb's (chiamarsi: mi chiamo,
 * chiamati) don't. So every form is read by its place: the row's tense and
 * mood, and the column's person.
 *
 * Forms are written with teaching accents (parlàto, chiamerémo) that are not
 * part of the spelling. Each word links to its page under the plain
 * spelling (parlato), so that is what is read; any accent left on a vowel
 * other than the last is dropped too.
 */

const TABLE_SELECTOR = 'table.roa-inflection-table';

/** "chiamerémo" -> "chiameremo"; "parlò" and "è" keep theirs, which are spelling. */
export function plainSpelling(text: string): string {
  return text
    .split(' ')
    .map((word) => {
      const letters = Array.from(word.normalize('NFD'));
      let last = letters.length - 1;
      while (last > 0 && /\p{M}/u.test(letters[last]!)) last--;
      return letters
        .filter((ch, i) => i >= last || !/[̀́]/.test(ch))
        .join('')
        .normalize('NFC');
    })
    .join(' ');
}

/** Without any accent, to compare spellings. */
function bare(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').trim();
}

/** The forms in a cell: links read as the pages they lead to, footnote marks dropped. */
function cellForms(cell: Element): string[] {
  const clone = cell.cloneNode(true) as Element;
  clone.querySelectorAll('sup, style, link').forEach((el) => el.remove());
  for (const a of Array.from(clone.querySelectorAll('a[title]'))) {
    const title = (a.getAttribute('title') ?? '').replace(/ \(page does not exist\)$/, '');
    // Only where the link is the word itself with other accents, not part of
    // a longer word linking to its base (chiamàr|si -> chiamare).
    if (bare(title) === bare(a.textContent ?? '')) a.textContent = title;
  }
  const forms = cleanText(clone)
    .split(',')
    .map((f) => plainSpelling(f.trim()))
    .filter((f) => f && f !== '—' && f !== '-');
  return [...new Set(forms)];
}

const NONFINITE_TAGS: Record<string, string[]> = {
  infinitive: ['inf'],
  'auxiliary verb': ['aux'],
  gerund: ['ger'],
  'present participle': ['pres', 'part'],
  'past participle': ['past', 'part'],
};

const FINITE_TAGS: Record<string, Record<string, string[]>> = {
  indicative: {
    present: ['pres', 'ind'],
    imperfect: ['impf', 'ind'],
    'past historic': ['phis'],
    future: ['fut'],
    conditional: ['cond'],
  },
  subjunctive: {
    present: ['pres', 'sub'],
    imperfect: ['impf', 'sub'],
  },
};

/** The imperative row's columns: none for "io", then tu, Lei, noi, voi, Loro. */
const IMPERATIVE_PERSONS: (Person | null)[] = [null, ...PERSONS.slice(1)];

const MOOD_CLASS = /\broa-(indicative|subjunctive|imperative)-left-rail\b/;

function parseInflections(table: Element): Inflection[] {
  const result: Inflection[] = [];
  const add = (tags: string[], forms: string[]) => {
    if (forms.length > 0) result.push({ tags, forms, ipa: [] });
  };
  let mood = '';

  for (const row of Array.from(table.querySelectorAll('tr'))) {
    const cells = Array.from(row.children);
    const tds = cells.filter((c) => c.tagName === 'TD');
    const first = cells[0];
    if (!first) continue;

    // Infinitive, auxiliary, gerund, participles: header and value side by side.
    if (first.classList.contains('roa-nonfinite-header')) {
      cells.forEach((cell, i) => {
        const next = cells[i + 1];
        const tags = cell.tagName === 'TH' ? NONFINITE_TAGS[label(cell)] : undefined;
        if (tags && next?.tagName === 'TD') add(tags, cellForms(next));
      });
      continue;
    }

    // A mood's header row (indicative | io | tu ...) has no forms.
    const moodMatch = MOOD_CLASS.exec(first.className);
    if (tds.length === 0) {
      if (moodMatch) mood = label(first) === 'imperative' ? 'imperative' : (moodMatch[1] ?? '');
      continue;
    }

    // The imperative's forms are in a row without a header; the negative imperative is left out.
    if (first.tagName === 'TD') {
      if (mood !== 'imperative' || tds.length !== IMPERATIVE_PERSONS.length) continue;
      tds.forEach((td, i) => {
        const person = IMPERATIVE_PERSONS[i];
        if (person) add([...person, 'imp'], cellForms(td));
      });
      continue;
    }

    const tense = FINITE_TAGS[mood]?.[label(first)];
    if (!tense || tds.length !== PERSONS.length) continue;
    tds.forEach((td, i) => add([...PERSONS[i]!, ...tense], cellForms(td)));
  }
  return result;
}

export function parseItalianVerbTables(section: Element, pageTitle: string): InflectionTable[] {
  return Array.from(section.querySelectorAll(TABLE_SELECTOR)).flatMap((table) => {
    const heading = cleanText(table.closest('.NavFrame')?.querySelector('.NavHead'));
    const isPresent = (i: Inflection) => i.tags.includes('pres') && i.tags.includes('ind');
    return verbTable('it', parseInflections(table), pageTitle, heading, isPresent) ?? [];
  });
}
