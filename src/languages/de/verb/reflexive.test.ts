import { describe, expect, it } from 'vitest';
import type { ConjugationRow } from '../../conjugation';
import { fixtureLoader, tenseIn } from '../../testing';
import { german } from '..';
import { conjugationLayout } from './layout';
import { reflexiveTable } from './reflexive';

const load = fixtureLoader(german);

const shown = (rows: ConjugationRow[]) => rows.map((r) => r.shown[0]);

describe('reflexiveTable', () => {
  it('puts the pronoun after the verb (sich freuen)', () => {
    const layout = conjugationLayout(reflexiveTable(load('freuen'), 'sich freuen'));
    expect(layout.lemma).toBe('sich freuen');
    expect(shown(tenseIn(layout, 'indikativ', 'Präsens'))).toEqual([
      'freue mich',
      'freust dich',
      'freut sich',
      'freuen uns',
      'freut euch',
      'freuen sich',
    ]);
    expect(tenseIn(layout, 'indikativ', 'Perfekt')[0]!.shown).toEqual(['habe mich gefreut']);
    expect(tenseIn(layout, 'indikativ', 'Futur I')[0]!.shown).toEqual(['werde mich freuen']);
    expect(tenseIn(layout, 'indikativ', 'Futur II')[0]!.shown).toEqual(['werde mich gefreut haben']);
    expect(layout.moods[3]!.pairs[0]![0]!.rows.map((b) => b.shown)).toEqual([
      ['freu dich', 'freue dich'],
      ['freut euch'],
    ]);
  });

  it('puts the pronoun before a separable prefix (sich ausruhen)', () => {
    const layout = conjugationLayout(reflexiveTable(load('ausruhen'), 'sich ausruhen'));
    expect(tenseIn(layout, 'indikativ', 'Präsens')[0]!.shown).toEqual(['ruhe mich aus']);
    expect(tenseIn(layout, 'indikativ', 'Perfekt')[0]!.shown).toEqual(['habe mich ausgeruht']);
  });
});
