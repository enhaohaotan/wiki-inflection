import type { Inflection, InflectionTable } from '../../../core/types';
import { cleanText } from '../../../wiktionary/page';

/**
 * Extracts Spanish verb conjugation tables from the Spanish section of a page.
 *
 * The forms carry no grammar tags (only "a form of hablar"), so each is read
 * by its place: the row's tense and mood, and the column's person. The tú
 * column also holds the voseo form, marked "vos" (hablas tú, hablás vos);
 * only the tú form is kept. A page has a table for the plain verb and, for
 * many verbs, one for the reflexive verb too (hablar, hablarse).
 */

const TABLE_SELECTOR = 'table.roa-inflection-table';

const FINITE_TAGS: Record<string, Record<string, string[]>> = {
  indicative: {
    present: ['pres', 'ind'],
    imperfect: ['impf', 'ind'],
    preterite: ['pret'],
    future: ['fut', 'ind'],
    conditional: ['cond'],
  },
  subjunctive: {
    present: ['pres', 'sub'],
    'imperfect(ra)': ['impf', 'sub', 'ra'],
    'imperfect(se)': ['impf', 'sub', 'se'],
    future: ['fut', 'sub'],
  },
  imperative: {
    affirmative: ['imp'],
  },
};

const PERSONS: ([string, string] | null)[] = [
  ['1', 's'],
  ['2', 's'],
  ['3', 's'],
  ['1', 'p'],
  ['2', 'p'],
  ['3', 'p'],
];

/** The imperative's columns: none for "yo", then tú, usted, nosotros, vosotros, ustedes. */
const IMPERATIVE_PERSONS: ([string, string] | null)[] = [null, ['2', 's'], ['3', 's'], ['1', 'p'], ['2', 'p'], ['3', 'p']];

const MOOD_CLASS = /\broa-(indicative|subjunctive|imperative)-left-rail\b/;

function label(cell: Element): string {
  const clone = cell.cloneNode(true) as Element;
  clone.querySelectorAll('sup').forEach((el) => el.remove());
  return cleanText(clone).toLowerCase();
}

/** The forms in a cell, without the voseo ones. */
function cellForms(cell: Element): string[] {
  const forms: string[] = [];
  for (const span of Array.from(cell.querySelectorAll('span.Latn'))) {
    const mark = span.nextElementSibling?.tagName === 'SUP' ? cleanText(span.nextElementSibling) : '';
    if (mark.startsWith('vos')) continue;
    const form = cleanText(span);
    if (form && form !== '—' && !forms.includes(form)) forms.push(form);
  }
  return forms;
}

function parseInflections(table: Element): Inflection[] {
  const result: Inflection[] = [];
  const add = (tags: string[], forms: string[]) => {
    if (forms.length > 0) result.push({ tags, forms, ipa: [] });
  };
  // Where the rows are: the non-finite forms at the top, then each mood.
  let mood = 'nonfinite';
  let participleRow = '';

  for (const row of Array.from(table.querySelectorAll('tr'))) {
    const cells = Array.from(row.children);
    const tds = cells.filter((c) => c.tagName === 'TD');
    const first = cells[0];
    if (!first) continue;

    // A mood's header row (indicative | yo | tú ...); a reflexive table's
    // "personal non-finite" rows (llamarme, llamarte...) are left out.
    if (tds.filter((td) => cleanText(td)).length === 0) {
      const moodMatch = MOOD_CLASS.exec(first.className);
      if (moodMatch) mood = moodMatch[1]!;
      else if (label(first) === 'personal non-finite') mood = 'personal';
      continue;
    }

    if (mood === 'nonfinite') {
      const name = label(first);
      if (name === 'infinitive') add(['inf'], cellForms(tds[0]!));
      else if (name === 'gerund') add(['ger'], cellForms(tds[0]!));
      // The participle's rows: singular (masculine, feminine), plural (masculine, feminine).
      else if (name === 'singular' || name === 'plural') participleRow = name;
      if (participleRow && tds.length === 2) {
        const num = participleRow === 'singular' ? 's' : 'p';
        add(['pp', 'm', num], cellForms(tds[0]!));
        add(['pp', 'f', num], cellForms(tds[1]!));
        participleRow = '';
      }
      continue;
    }

    const tense = FINITE_TAGS[mood]?.[label(first)];
    if (!tense || tds.length !== PERSONS.length) continue;
    const persons = mood === 'imperative' ? IMPERATIVE_PERSONS : PERSONS;
    tds.forEach((td, i) => {
      const person = persons[i];
      if (person) add([...person, ...tense], cellForms(td));
    });
  }
  return result;
}

/** "Conjugation of sentir (e-ie-i alternation) (See Appendix:Spanish verbs)" -> "e-ie-i alternation". */
function verbClass(frame: Element | null): string {
  const head = cleanText(frame?.querySelector('.NavHead'));
  return /\(((?!See )[^)]*)\)/.exec(head)?.[1] ?? '';
}

export function parseSpanishVerbTables(section: Element, pageTitle: string): InflectionTable[] {
  const tables: InflectionTable[] = [];
  for (const table of Array.from(section.querySelectorAll(TABLE_SELECTOR))) {
    const inflections = parseInflections(table);
    if (!inflections.some((i) => i.tags.includes('pres') && i.tags.includes('ind'))) continue;

    const lemma = inflections.find((i) => i.tags[0] === 'inf')?.forms[0] ?? pageTitle;
    const meta: Record<string, string> = { page: pageTitle };
    const verbClassNote = verbClass(table.closest('.NavFrame'));
    if (verbClassNote) meta.class = verbClassNote;

    tables.push({
      lang: 'es',
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
