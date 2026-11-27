import { describe, expect, it } from 'vitest';
import { fixtureLoader, tenseIn } from '../../testing';
import { italian } from '..';
import { conjugationLayout } from './layout';

const load = fixtureLoader(italian);

describe('conjugationLayout', () => {
  it('lays out the moods and tenses, the compound and literary tenses folded', () => {
    const layout = conjugationLayout(load('parlare'));
    expect(layout.moods.map((s) => s.name)).toEqual([
      'Indicativo',
      'Condizionale',
      'Congiuntivo',
      'Imperativo',
      'Participio e gerundio',
    ]);
    const indicativo = layout.moods[0]!.pairs.flat();
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
    const layout = conjugationLayout(load('parlare'));
    const blanks = tenseIn(layout, 'indicativo', 'Passato prossimo');
    expect(blanks.map((b) => [b.label, b.shown])).toEqual([
      ['io', ['ho parlato']],
      ['tu', ['hai parlato']],
      ['lui/lei', ['ha parlato']],
      ['noi', ['abbiamo parlato']],
      ['voi', ['avete parlato']],
      ['loro', ['hanno parlato']],
    ]);
    expect(tenseIn(layout, 'congiuntivo', 'Presente')[0]!.label).toBe('che io');
    expect(tenseIn(layout, 'imperativo', 'Presente').map((b) => [b.label, b.shown])).toEqual([
      ['(tu)', ['parla']],
      ['(noi)', ['parliamo']],
      ['(voi)', ['parlate']],
    ]);
  });

  it('agrees the participle after essere', () => {
    const blanks = tenseIn(conjugationLayout(load('andare')), 'indicativo', 'Passato prossimo');
    expect(blanks[0]!.shown).toEqual(['sono andato/a']);
    expect(blanks[0]!.accepted).toEqual(['sono andato', 'sono andata']);
    expect(blanks[3]!.shown).toEqual(['siamo andati/e']);
    expect(blanks[3]!.accepted).toEqual(['siamo andati', 'siamo andate']);
  });

  it('shows the usual auxiliary and accepts the other when the verb takes both (finire)', () => {
    const blanks = tenseIn(conjugationLayout(load('finire')), 'indicativo', 'Passato prossimo');
    expect(blanks[0]!.shown).toEqual(['ho finito']);
    expect(blanks[0]!.accepted).toEqual(['ho finito', 'sono finito', 'sono finita']);
  });

  it('puts the reflexive pronoun before essere (chiamarsi)', () => {
    const layout = conjugationLayout(load('chiamarsi'));
    expect(tenseIn(layout, 'indicativo', 'Presente')[0]!.shown).toEqual(['mi chiamo']);
    const passato = tenseIn(layout, 'indicativo', 'Passato prossimo');
    expect(passato[0]!.shown).toEqual(['mi sono chiamato/a']);
    expect(passato[4]!.accepted).toEqual(['vi siete chiamati', 'vi siete chiamate']);
    const participle = layout.moods.at(-1)!.pairs[0]![0]!.rows;
    expect(participle.map((b) => [b.label, b.shown])).toEqual([
      ['participio passato', ['chiamato']],
      ['gerundio', ['chiamandosi']],
    ]);
  });
});
