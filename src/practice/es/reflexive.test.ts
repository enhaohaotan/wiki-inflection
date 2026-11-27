import { describe, expect, it } from 'vitest';
import { conjugationLayout } from '../../languages/es/verb/layout';
import { parseSpanishVerbTables } from '../../languages/es/verb/parse';
import { attach, reflexiveTable } from '../../languages/es/verb/reflexive';
import { fixtureLoader, sheetBuilder, tense } from '../testing';

const load = fixtureLoader('es', 'Spanish', parseSpanishVerbTables);
const buildSheet = sheetBuilder(conjugationLayout);

describe('reflexiveTable', () => {
  it('attaches the pronoun with the accent the stress needs', () => {
    expect(attach('levanta', 'te')).toBe('levántate');
    expect(attach('sienta', 'te')).toBe('siéntate');
    expect(attach('acueste', 'se')).toBe('acuéstese');
    expect(attach('busque', 'se')).toBe('búsquese');
    expect(attach('cuida', 'te')).toBe('cuídate');
    expect(attach('levantando', 'se')).toBe('levantándose');
    expect(attach('haz', 'te')).toBe('hazte');
    expect(attach('levantemo', 'nos', 'levantemos')).toBe('levantémonos');
  });

  it('builds a reflexive verb from its plain verb (hablar -> hablarse)', () => {
    const table = reflexiveTable(load('hablar'), 'hablarse');
    const own = load('hablar', 'hablarse');
    const sheet = buildSheet(table);
    // The same as Wiktionary's own table of hablarse.
    for (const name of ['Presente', 'Pretérito indefinido']) {
      expect(tense(sheet, 'indicativo', name).map((b) => b.forms)).toEqual(
        tense(buildSheet(own), 'indicativo', name).map((b) => b.forms),
      );
    }
    expect(tense(sheet, 'imperativo', 'Afirmativo').map((b) => b.forms)).toEqual(
      tense(buildSheet(own), 'imperativo', 'Afirmativo').map((b) => b.forms),
    );
    expect(sheet.sections.at(-1)!.pairs[0]![0]!.blanks[0]!.forms).toEqual(['hablándose']);
  });

  it('writes the vosotros imperative of an -ir verb with í (vivid -> vivíos)', () => {
    const table = reflexiveTable(load('vivir'), 'vivirse');
    expect(tense(buildSheet(table), 'imperativo', 'Afirmativo')[3]!.forms).toEqual(['vivíos']);
  });
});
