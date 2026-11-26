import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../core/types';
import { french } from '../../languages/fr';
import { conjugationLayout } from '../../languages/fr/verb/conjugation';
import { expandForm } from '../../languages/fr/verb/notation';
import { findLanguageSection, parsePage } from '../../wiktionary/page';
import { isCorrect as isCorrectIn } from '../answers';
import { randomVerb } from '../random';
import { fromStored, storeTable } from '../saved';
import { buildSheet as sheetOf } from '../sheet';
import type { Blank, Sheet } from '../types';
import { lacksAgreement } from '.';
import { PRACTICE_VERBS } from './verbs';

const buildSheet = (table: InflectionTable) => sheetOf(conjugationLayout(table));
const isCorrect = (answer: string, blank: Blank) => isCorrectIn(answer, blank, 'fr');

function section(fixture: string): Element | null {
  try {
    const html = readFileSync(resolve(process.cwd(), 'test/fixtures', `${fixture}.html`), 'utf8');
    return findLanguageSection(parsePage(html), 'French');
  } catch {
    return null;
  }
}

async function sheetFor(verb: string): Promise<Sheet> {
  const entry = await french.enrich!(
    french.parse(section(verb)!, verb),
    async (title) => section(`pp-${title}`),
    async () => null,
  );
  return buildSheet(entry.tables[0]!);
}

function blank(sheet: Sheet, mood: string, tense: string, index: number): Blank {
  const exercise = sheet.sections
    .find((s) => s.id === mood)
    ?.pairs.flat()
    .find((e) => e.name === tense);
  const found = exercise?.blanks[index];
  if (!found) throw new Error(`no ${mood} ${tense} ${index}`);
  return found;
}

describe('expandForm', () => {
  it('spells out agreement notation', () => {
    expect(expandForm('suis allé(e)')).toEqual(['suis allé', 'suis allée']);
    expect(expandForm('sommes allé(e)s')).toEqual(['sommes allés', 'sommes allées']);
    expect(expandForm('êtes allé(e)(s)')).toEqual(['êtes allé', 'êtes allés', 'êtes allée', 'êtes allées']);
    expect(expandForm('me suis dissous / dissoute')).toEqual(['me suis dissous', 'me suis dissoute']);
    expect(expandForm('mange')).toEqual(['mange']);
  });
});

describe('buildSheet', () => {
  it('elides the subject pronoun before a vowel', async () => {
    const sheet = await sheetFor('aller');
    expect(blank(sheet, 'indicatif', 'Imparfait', 0).label).toBe('j’');
    expect(blank(sheet, 'indicatif', 'Passé composé', 0).label).toBe('je');
    expect(blank(sheet, 'subjonctif', 'Présent', 0).label).toBe('que j’');
    expect(blank(sheet, 'indicatif', 'Futur simple', 0).label).toBe('j’');
    // two auxiliaries, two ways of writing the pronoun: j’ai passé / je suis passé(e)
    expect(blank(await sheetFor('passer'), 'indicatif', 'Passé composé', 0).label).toBe('j’ / je');
  });

  it('has a blank per person', async () => {
    const sheet = await sheetFor('aller');
    expect(sheet.lemma).toBe('aller');
    expect(sheet.sections.map((s) => s.id)).toEqual(['indicatif', 'conditionnel', 'subjonctif', 'imperatif', 'participe']);

    const present = sheet.sections[0]!.pairs[0]!;
    expect(present.map((e) => e.name)).toEqual(['Présent', 'Passé composé']);
    expect(present[0]!.blanks.map((b) => b.label)).toEqual(['je', 'tu', 'il/elle/on', 'nous', 'vous', 'ils/elles']);
    expect(blank(sheet, 'subjonctif', 'Présent', 2).label).toBe('qu’il/elle/on');
    expect(blank(sheet, 'imperatif', 'Présent', 0).label).toBe('(tu)');
  });

  it('accepts every agreed form of a compound tense with être', async () => {
    const sheet = await sheetFor('aller');
    const pc = blank(sheet, 'indicatif', 'Passé composé', 0);
    expect(pc.forms).toEqual(['suis allé(e)']);
    expect(isCorrect('suis allée', pc)).toBe(true);
    expect(isCorrect('  Suis   allé ', pc)).toBe(true);
    expect(isCorrect('suis alle', pc)).toBe(false);
    expect(isCorrect('ai allé', pc)).toBe(false);
  });

  it('accepts the agreed past participles', async () => {
    const sheet = await sheetFor('aller');
    const pp = blank(sheet, 'participe', 'Participe', 1);
    expect(pp.label).toBe('passé');
    expect(isCorrect('allées', pp)).toBe(true);
  });

  it('leaves no blank to fill where the verb has no form', async () => {
    const sheet = await sheetFor('pleuvoir');
    const present = sheet.sections[0]!.pairs[0]![0]!;
    expect(present.blanks.map((b) => b.forms.length > 0)).toEqual([false, false, true, false, false, true]);
  });

  it('accepts either auxiliary when both are used', async () => {
    const sheet = await sheetFor('passer');
    const pc = blank(sheet, 'indicatif', 'Passé composé', 0);
    expect(isCorrect('ai passé', pc)).toBe(true);
    expect(isCorrect('suis passée', pc)).toBe(true);
  });

  it('accepts typographic apostrophes', async () => {
    const sheet = await sheetFor('asseoir');
    const reflexive = sheet.sections[0]!.pairs[0]![0]!.blanks[0]!;
    const form = reflexive.forms[0]!;
    expect(isCorrect(form.replace(/'/g, '’'), reflexive)).toBe(true);
  });
});

describe('randomVerb', () => {
  it('never picks the verb already shown', () => {
    const [first, second] = PRACTICE_VERBS;
    expect(randomVerb(PRACTICE_VERBS, first, () => 0)).toBe(second);
    expect(randomVerb(PRACTICE_VERBS, second, () => 0)).toBe(first);
    expect(randomVerb(PRACTICE_VERBS, first, () => 0.9999)).toBe(PRACTICE_VERBS.at(-1));
    expect(PRACTICE_VERBS).not.toContain('gésir');
    expect(new Set(PRACTICE_VERBS).size).toBe(PRACTICE_VERBS.length);
  });
});

describe('lacksAgreement', () => {
  it('spots a table with être whose agreed participles were not fetched', async () => {
    const parsed = french.parse(section('aller')!, 'aller').tables[0]!;
    expect(lacksAgreement(parsed)).toBe(true);
    const entry = await french.enrich!(french.parse(section('aller')!, 'aller'), async (t) => section(`pp-${t}`), async () => null);
    expect(lacksAgreement(entry.tables[0]!)).toBe(false);
    // avoir verbs need none
    expect(lacksAgreement(french.parse(section('manger')!, 'manger').tables[0]!)).toBe(false);
  });
});

describe('saved tables', () => {
  it('give the same sheet as the table they were saved from', async () => {
    for (const verb of ['aller', 'passer', 'asseoir', 'pleuvoir']) {
      const entry = await french.enrich!(french.parse(section(verb)!, verb), async (t) => section(`pp-${t}`), async () => null);
      const table = entry.tables[0]!;
      const restored = fromStored(JSON.parse(JSON.stringify(storeTable(table))), 'fr');
      expect(buildSheet(restored), verb).toEqual(buildSheet(table));
    }
  });
});

describe('the practice list', () => {
  it('has 200 verbs', () => {
    expect(PRACTICE_VERBS).toHaveLength(200);
  });
});
