import { describe, expect, it } from 'vitest';
import { fixtureLoader, tenseIn } from '../../testing';
import { italian } from '..';
import { conjugationLayout } from './layout';
import { reflexiveTable } from './reflexive';

const load = fixtureLoader(italian);

describe('reflexiveTable', () => {
  it('builds a reflexive verb from its plain verb (parlare -> parlarsi)', () => {
    const layout = conjugationLayout(reflexiveTable(load('parlare'), 'parlarsi'));
    expect(layout.lemma).toBe('parlarsi');
    expect(tenseIn(layout, 'indicativo', 'Presente').map((b) => b.shown[0])).toEqual([
      'mi parlo',
      'ti parli',
      'si parla',
      'ci parliamo',
      'vi parlate',
      'si parlano',
    ]);
    expect(tenseIn(layout, 'imperativo', 'Presente').map((b) => b.shown)).toEqual([['parlati'], ['parliamoci'], ['parlatevi']]);
    expect(tenseIn(layout, 'indicativo', 'Passato prossimo')[2]!.shown).toEqual(['si è parlato/a']);
  });
});
