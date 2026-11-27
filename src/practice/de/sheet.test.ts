import { describe, expect, it } from 'vitest';
import { conjugationLayout } from '../../languages/de/verb/layout';
import { parseGermanVerbTables } from '../../languages/de/verb/parse';
import { fixtureLoader, sheetBuilder, tense } from '../testing';
import type { Blank } from '../types';

const load = fixtureLoader('de', 'German', parseGermanVerbTables);
const buildSheet = sheetBuilder(conjugationLayout);

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
