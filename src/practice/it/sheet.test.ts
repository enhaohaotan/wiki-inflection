import { describe, expect, it } from 'vitest';
import { conjugationLayout } from '../../languages/it/verb/layout';
import { parseItalianVerbTables } from '../../languages/it/verb/parse';
import { fixtureLoader, sheetBuilder, tense } from '../testing';

const load = fixtureLoader('it', 'Italian', parseItalianVerbTables);
const buildSheet = sheetBuilder(conjugationLayout);

describe('buildSheet', () => {
  it('lays out the moods and tenses, the compound and literary tenses folded', () => {
    const sheet = buildSheet(load('parlare'));
    expect(sheet.sections.map((s) => s.name)).toEqual([
      'Indicativo',
      'Condizionale',
      'Congiuntivo',
      'Imperativo',
      'Participio e gerundio',
    ]);
    const indicativo = sheet.sections[0]!.pairs.flat();
    expect(indicativo.map((e) => [e.name, e.folded])).toEqual([
      ['Presente', false],
      ['Passato prossimo', true],
      ['Imperfetto', false],
      ['Trapassato prossimo', true],
      ['Passato remoto', true],
      ['Trapassato remoto', true],
      ['Futuro semplice', false],
      ['Futuro anteriore', true],
    ]);
  });

  it('builds the compound tenses with avere', () => {
    const sheet = buildSheet(load('parlare'));
    const blanks = tense(sheet, 'indicativo', 'Passato prossimo');
    expect(blanks.map((b) => [b.label, b.forms])).toEqual([
      ['io', ['ho parlato']],
      ['tu', ['hai parlato']],
      ['lui/lei', ['ha parlato']],
      ['noi', ['abbiamo parlato']],
      ['voi', ['avete parlato']],
      ['loro', ['hanno parlato']],
    ]);
    expect(tense(sheet, 'congiuntivo', 'Presente')[0]!.label).toBe('che io');
    expect(tense(sheet, 'imperativo', 'Presente').map((b) => [b.label, b.forms])).toEqual([
      ['(tu)', ['parla']],
      ['(noi)', ['parliamo']],
      ['(voi)', ['parlate']],
    ]);
  });

  it('agrees the participle after essere', () => {
    const blanks = tense(buildSheet(load('andare')), 'indicativo', 'Passato prossimo');
    expect(blanks[0]!.forms).toEqual(['sono andato/a']);
    expect(blanks[0]!.accepted).toEqual(['sono andato', 'sono andata']);
    expect(blanks[3]!.forms).toEqual(['siamo andati/e']);
    expect(blanks[3]!.accepted).toEqual(['siamo andati', 'siamo andate']);
  });

  it('shows the usual auxiliary and accepts the other when the verb takes both (finire)', () => {
    const blanks = tense(buildSheet(load('finire')), 'indicativo', 'Passato prossimo');
    expect(blanks[0]!.forms).toEqual(['ho finito']);
    expect(blanks[0]!.accepted).toEqual(['ho finito', 'sono finito', 'sono finita']);
  });

  it('puts the reflexive pronoun before essere (chiamarsi)', () => {
    const sheet = buildSheet(load('chiamarsi'));
    expect(tense(sheet, 'indicativo', 'Presente')[0]!.forms).toEqual(['mi chiamo']);
    const passato = tense(sheet, 'indicativo', 'Passato prossimo');
    expect(passato[0]!.forms).toEqual(['mi sono chiamato/a']);
    expect(passato[4]!.accepted).toEqual(['vi siete chiamati', 'vi siete chiamate']);
    const participle = sheet.sections.at(-1)!.pairs[0]![0]!.blanks;
    expect(participle.map((b) => [b.label, b.forms])).toEqual([
      ['participio passato', ['chiamato']],
      ['gerundio', ['chiamandosi']],
    ]);
  });
});
