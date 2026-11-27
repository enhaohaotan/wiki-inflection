import { describe, expect, it } from 'vitest';
import { fixtureLoader, tenseIn } from '../../testing';
import { spanish } from '..';
import { conjugationLayout } from './layout';
import { attach, reflexiveTable } from './reflexive';

const load = fixtureLoader(spanish);

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
    const layout = conjugationLayout(table);
    // The same as Wiktionary's own table of hablarse.
    for (const name of ['Presente', 'Pretérito indefinido']) {
      expect(tenseIn(layout, 'indicativo', name).map((b) => b.shown)).toEqual(
        tenseIn(conjugationLayout(own), 'indicativo', name).map((b) => b.shown),
      );
    }
    expect(tenseIn(layout, 'imperativo', 'Afirmativo').map((b) => b.shown)).toEqual(
      tenseIn(conjugationLayout(own), 'imperativo', 'Afirmativo').map((b) => b.shown),
    );
    expect(layout.moods.at(-1)!.pairs[0]![0]!.rows[0]!.shown).toEqual(['hablándose']);
  });

  it('writes the vosotros imperative of an -ir verb with í (vivid -> vivíos)', () => {
    const table = reflexiveTable(load('vivir'), 'vivirse');
    expect(tenseIn(conjugationLayout(table), 'imperativo', 'Afirmativo')[3]!.shown).toEqual(['vivíos']);
  });
});
