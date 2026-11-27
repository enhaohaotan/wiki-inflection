import { describe, expect, it } from 'vitest';
import { conjugationLayout } from '../../languages/de/verb/layout';
import { parseGermanVerbTables } from '../../languages/de/verb/parse';
import { reflexiveTable } from '../../languages/de/verb/reflexive';
import { fixtureLoader, sheetBuilder, tense } from '../testing';
import type { Blank } from '../types';

const load = fixtureLoader('de', 'German', parseGermanVerbTables);
const buildSheet = sheetBuilder(conjugationLayout);

const shown = (blanks: Blank[]) => blanks.map((b) => b.forms[0]);

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
