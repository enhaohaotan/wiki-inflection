import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../core/types';
import { conjugationLayout } from '../../languages/de/verb/layout';
import { parseGermanVerbTables } from '../../languages/de/verb/parse';
import { reflexiveTable } from '../../languages/de/verb/reflexive';
import { findLanguageSection, parsePage } from '../../wiktionary/page';
import { buildSheet as sheetOf } from '../sheet';
import type { Blank, Sheet } from '../types';
import { kindOf } from './kinds';

const buildSheet = (table: InflectionTable) => sheetOf(conjugationLayout(table));

function load(word: string): InflectionTable {
  const html = readFileSync(resolve(process.cwd(), 'test/fixtures/de', `${word}.html`), 'utf8');
  return parseGermanVerbTables(findLanguageSection(parsePage(html), 'German')!, word)[0]!;
}

function tense(sheet: Sheet, mood: string, name: string): Blank[] {
  const section = sheet.sections.find((s) => s.id === mood)!;
  return section.pairs.flat().find((e) => e.name === name)!.blanks;
}

const shown = (blanks: Blank[]) => blanks.map((b) => b.forms[0]);

describe('buildSheet', () => {
  it('lays out the moods and tenses, the built tenses and Konjunktiv I folded', () => {
    const sheet = buildSheet(load('machen'));
    expect(sheet.sections.map((s) => s.name)).toEqual([
      'Indikativ',
      'Konjunktiv I',
      'Konjunktiv II',
      'Imperativ',
      'Partizip',
    ]);
    expect(sheet.sections[0]!.pairs.flat().map((e) => [e.name, e.folded])).toEqual([
      ['Präsens', false],
      ['Perfekt', true],
      ['Präteritum', false],
      ['Plusquamperfekt', true],
      ['Futur I', true],
      ['Futur II', true],
    ]);
    expect(sheet.sections[1]!.pairs.flat().every((e) => e.folded)).toBe(true);
    expect(tense(sheet, 'indikativ', 'Präsens').map((b) => b.label)).toEqual([
      'ich',
      'du',
      'er/sie/es',
      'wir',
      'ihr',
      'sie/Sie',
    ]);
  });

  it('builds the compound tenses with haben and werden', () => {
    const sheet = buildSheet(load('machen'));
    expect(shown(tense(sheet, 'indikativ', 'Perfekt'))).toEqual([
      'habe gemacht',
      'hast gemacht',
      'hat gemacht',
      'haben gemacht',
      'habt gemacht',
      'haben gemacht',
    ]);
    expect(tense(sheet, 'indikativ', 'Futur I')[1]!.forms).toEqual(['wirst machen']);
    expect(tense(sheet, 'indikativ', 'Futur II')[0]!.forms).toEqual(['werde gemacht haben']);
    expect(tense(sheet, 'konjunktiv-2', 'würde + Infinitiv')[0]!.forms).toEqual(['würde machen']);
    expect(tense(sheet, 'konjunktiv-2', 'Plusquamperfekt')[0]!.forms).toEqual(['hätte gemacht']);
  });

  it('shows the usual auxiliary and accepts the other (fahren, anfangen)', () => {
    const fahren = tense(buildSheet(load('fahren')), 'indikativ', 'Perfekt')[0]!;
    expect(fahren.forms).toEqual(['bin gefahren']);
    expect(fahren.accepted).toEqual(['bin gefahren', 'habe gefahren']);
    const anfangen = tense(buildSheet(load('anfangen')), 'indikativ', 'Perfekt')[0]!;
    expect(anfangen.forms).toEqual(['habe angefangen']);
    expect(anfangen.accepted).toEqual(['habe angefangen', 'bin angefangen']);
  });

  it('keeps a separable verb whole in the future (werde anfangen)', () => {
    const sheet = buildSheet(load('anfangen'));
    expect(tense(sheet, 'indikativ', 'Präsens')[0]!.forms).toEqual(['fange an']);
    expect(tense(sheet, 'indikativ', 'Futur I')[0]!.forms).toEqual(['werde anfangen']);
  });

  it('asks for the imperative of du and ihr, and both participles', () => {
    const sheet = buildSheet(load('machen'));
    expect(sheet.sections[3]!.pairs[0]![0]!.blanks.map((b) => [b.label, b.forms])).toEqual([
      ['(du)', ['mach', 'mache']],
      ['(ihr)', ['macht']],
    ]);
    expect(sheet.sections[4]!.pairs[0]![0]!.blanks.map((b) => [b.label, b.forms])).toEqual([
      ['Partizip I', ['machend']],
      ['Partizip II', ['gemacht']],
    ]);
  });
});

describe('reflexiveTable', () => {
  it('puts the pronoun after the verb (sich freuen)', () => {
    const sheet = buildSheet(reflexiveTable(load('freuen'), 'sich freuen'));
    expect(sheet.lemma).toBe('sich freuen');
    expect(shown(tense(sheet, 'indikativ', 'Präsens'))).toEqual([
      'freue mich',
      'freust dich',
      'freut sich',
      'freuen uns',
      'freut euch',
      'freuen sich',
    ]);
    expect(tense(sheet, 'indikativ', 'Perfekt')[0]!.forms).toEqual(['habe mich gefreut']);
    expect(tense(sheet, 'indikativ', 'Futur I')[0]!.forms).toEqual(['werde mich freuen']);
    expect(tense(sheet, 'indikativ', 'Futur II')[0]!.forms).toEqual(['werde mich gefreut haben']);
    expect(sheet.sections[3]!.pairs[0]![0]!.blanks.map((b) => b.forms)).toEqual([
      ['freu dich', 'freue dich'],
      ['freut euch'],
    ]);
  });

  it('puts the pronoun before a separable prefix (sich ausruhen)', () => {
    const sheet = buildSheet(reflexiveTable(load('ausruhen'), 'sich ausruhen'));
    expect(tense(sheet, 'indikativ', 'Präsens')[0]!.forms).toEqual(['ruhe mich aus']);
    expect(tense(sheet, 'indikativ', 'Perfekt')[0]!.forms).toEqual(['habe mich ausgeruht']);
  });
});

describe('kindOf', () => {
  it('goes by the class Wiktionary gives, then by the ending', () => {
    expect(kindOf('fahren', load('fahren'))).toBe('irregular');
    expect(kindOf('sein', load('sein'))).toBe('irregular');
    expect(kindOf('machen', load('machen'))).toBe('regular');
    expect(kindOf('arbeiten', undefined)).toBe('spelling');
    expect(kindOf('öffnen', undefined)).toBe('spelling');
    expect(kindOf('lächeln', undefined)).toBe('spelling');
  });
});
