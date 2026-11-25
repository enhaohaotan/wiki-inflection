import type { InflectionTable } from '../../core/types';
import type { LanguageModule } from '../registry';
import { cleanText, formOfTargets } from '../../wiktionary/page';
import { parseDanishAdjective } from './adjective/parse';
import { parseDanishAdverb } from './adverb/parse';
import { parseDanishDeclension } from './noun/parse';
import { danishNumberValue, standardFirst, danishNumberWord, numeralRow, numeralTable, parseNumberBox } from './numeral/parse';
import { numeralAppendix } from './reference';
import { findPersonalTable, parsePersonalTable, parsePronounHeadword } from './pronoun/parse';
import { parseDanishConjugation } from './verb/parse';

function headingText(section: Element): string {
  const first = section.firstElementChild;
  return first && /^H[1-6]$/.test(first.tagName) ? cleanText(first) : '';
}

export const danish: LanguageModule = {
  code: 'da',
  name: 'Danish',
  locale: 'da',
  heading: 'Danish',
  parse(section, pageTitle) {
    // Conjugations, declensions, adjectives and adverbs in page order (spise is a noun, then a verb).
    const tables: InflectionTable[] = [];
    // Personal pronoun pages share one table of all of them: show it once,
    // at the pronoun's place, when it contains this word.
    const personal = findPersonalTable(section);
    let personalShown = false;
    // A numeral's page starts with a "Danish numbers" box (value, cardinal, ordinal).
    const box = parseNumberBox(section);
    if (box) tables.push(numeralTable(box, pageTitle));
    for (const s of Array.from(section.querySelectorAll('section'))) {
      const heading = headingText(s);
      // A numeral without the box (otteogfirs, tusind): the value comes from
      // the word itself when it is 0–100, else from the appendix.
      if (/^Numeral\b/.test(heading)) {
        if (!box && !tables.some((t) => t.pos === 'numeral')) {
          const value = danishNumberValue(pageTitle) ?? '';
          tables.push(numeralTable({ value, cardinal: [pageTitle], ordinal: [] }, pageTitle));
        }
        continue;
      }
            if (/^Pronoun\b/.test(heading)) {
        if (personalShown) continue; // the table already covers this page's pronouns
        const fromTable = personal ? parsePersonalTable(personal, pageTitle) : null;
        const table = fromTable ?? parsePronounHeadword(s, pageTitle);
        if (fromTable) personalShown = true;
        if (table) tables.push(table);
        continue;
      }
      const table = /^Conjugation\b/.test(heading)
        ? parseDanishConjugation(s, pageTitle)
        : /^Declension\b/.test(heading)
          ? parseDanishDeclension(s, pageTitle)
          : /^Adjective\b/.test(heading)
            ? parseDanishAdjective(s, pageTitle)
            : /^Adverb\b/.test(heading)
              ? parseDanishAdverb(s, pageTitle)
              : null;
      if (table) tables.push(table);
    }
    return { lang: 'da', title: pageTitle, tables };
  },
  normalizeQuery(query) {
    // Numbers typed as digits, 0–100: "25" -> "femogtyve".
    return danishNumberWord(query.trim()) ?? query;
  },

  async enrich(entry, _fetchSection, fetchDocument) {
    if (!entry.tables.some((t) => t.pos === 'numeral')) return entry;
    const groups = await numeralAppendix(fetchDocument);
    const rows = groups.flatMap((g) => g.rows);
    return {
      ...entry,
      tables: entry.tables.map((t) => {
        if (t.pos !== 'numeral') return t;
        const forms = (tag: string) => t.inflections.find((i) => i.tags[0] === tag)?.forms ?? [];
        // The value from the page (its number box, or the word itself), else from
        // the appendix row the word is in (tusind has no number box).
        const value =
          forms('value')[0] ?? rows.find((r) => r.cardinal.includes(t.lemma) || r.ordinal.includes(t.lemma))?.value;
        // All forms by one rule, not as each page happens to list them.
        const row = value ? numeralRow(value, groups) : null;
        const table = row
          ? numeralTable(row, t.lemma)
          : numeralTable({ value: value ?? '', cardinal: forms('cardinal'), ordinal: standardFirst(forms('ordinal')) }, t.lemma);
        // The table of all numerals goes along, shown under the numeral itself.
        return { ...table, meta: { ...t.meta, total: JSON.stringify(groups) } };
      }),
    };
  },

    lemmasOf(section) {
    return formOfTargets(section, 'da', (heading) => /^(Verb|Participle|Noun|Adjective|Adverb|Pronoun|Numeral)\b/.test(heading));
  },
};
