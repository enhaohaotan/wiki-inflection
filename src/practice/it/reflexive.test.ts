import { describe, expect, it } from 'vitest';
import { conjugationLayout } from '../../languages/it/verb/layout';
import { parseItalianVerbTables } from '../../languages/it/verb/parse';
import { reflexiveTable } from '../../languages/it/verb/reflexive';
import { fixtureLoader, sheetBuilder, tense } from '../testing';

const load = fixtureLoader('it', 'Italian', parseItalianVerbTables);
const buildSheet = sheetBuilder(conjugationLayout);

describe('reflexiveTable', () => {
  it('builds a reflexive verb from its plain verb (parlare -> parlarsi)', () => {
    const sheet = buildSheet(reflexiveTable(load('parlare'), 'parlarsi'));
    expect(sheet.lemma).toBe('parlarsi');
    expect(tense(sheet, 'indicativo', 'Presente').map((b) => b.forms[0])).toEqual([
      'mi parlo',
      'ti parli',
      'si parla',
      'ci parliamo',
      'vi parlate',
      'si parlano',
    ]);
    expect(tense(sheet, 'imperativo', 'Presente').map((b) => b.forms)).toEqual([['parlati'], ['parliamoci'], ['parlatevi']]);
    expect(tense(sheet, 'indicativo', 'Passato prossimo')[2]!.forms).toEqual(['si è parlato/a']);
  });
});
