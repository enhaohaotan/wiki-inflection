import { describe, expect, it } from 'vitest';
import type { ConjugationRow } from '../../conjugation';
import { fixtureLoader, tenseIn } from '../../testing';
import { german } from '..';
import { conjugationLayout } from './layout';

const load = fixtureLoader(german);

const shown = (rows: ConjugationRow[]) => rows.map((r) => r.shown[0]);

describe('conjugationLayout', () => {
  it('lays out the moods and tenses, the built tenses and Konjunktiv I folded', () => {
    const layout = conjugationLayout(load('machen'));
    expect(layout.moods.map((s) => s.name)).toEqual([
      'Indikativ',
      'Konjunktiv I',
      'Konjunktiv II',
      'Imperativ',
      'Partizip',
    ]);
    expect(layout.moods[0]!.pairs.flat().map((e) => [e.name, e.folded])).toEqual([
      ['Präsens', false],
      ['Perfekt', true],
      ['Präteritum', false],
      ['Plusquamperfekt', true],
      ['Futur I', true],
      ['Futur II', true],
    ]);
    expect(layout.moods[1]!.pairs.flat().every((e) => e.folded)).toBe(true);
    expect(tenseIn(layout, 'indikativ', 'Präsens').map((b) => b.label)).toEqual([
      'ich',
      'du',
      'er/sie/es',
      'wir',
      'ihr',
      'sie/Sie',
    ]);
  });

  it('builds the compound tenses with haben and werden', () => {
    const layout = conjugationLayout(load('machen'));
    expect(shown(tenseIn(layout, 'indikativ', 'Perfekt'))).toEqual([
      'habe gemacht',
      'hast gemacht',
      'hat gemacht',
      'haben gemacht',
      'habt gemacht',
      'haben gemacht',
    ]);
    expect(tenseIn(layout, 'indikativ', 'Futur I')[1]!.shown).toEqual(['wirst machen']);
    expect(tenseIn(layout, 'indikativ', 'Futur II')[0]!.shown).toEqual(['werde gemacht haben']);
    expect(tenseIn(layout, 'konjunktiv-2', 'würde + Infinitiv')[0]!.shown).toEqual(['würde machen']);
    expect(tenseIn(layout, 'konjunktiv-2', 'Plusquamperfekt')[0]!.shown).toEqual(['hätte gemacht']);
  });

  it('shows the usual auxiliary and accepts the other (fahren, anfangen)', () => {
    const fahren = tenseIn(conjugationLayout(load('fahren')), 'indikativ', 'Perfekt')[0]!;
    expect(fahren.shown).toEqual(['bin gefahren']);
    expect(fahren.accepted).toEqual(['bin gefahren', 'habe gefahren']);
    const anfangen = tenseIn(conjugationLayout(load('anfangen')), 'indikativ', 'Perfekt')[0]!;
    expect(anfangen.shown).toEqual(['habe angefangen']);
    expect(anfangen.accepted).toEqual(['habe angefangen', 'bin angefangen']);
  });

  it('keeps a separable verb whole in the future (werde anfangen)', () => {
    const layout = conjugationLayout(load('anfangen'));
    expect(tenseIn(layout, 'indikativ', 'Präsens')[0]!.shown).toEqual(['fange an']);
    expect(tenseIn(layout, 'indikativ', 'Futur I')[0]!.shown).toEqual(['werde anfangen']);
  });

  it('asks for the imperative of du and ihr, and both participles', () => {
    const layout = conjugationLayout(load('machen'));
    expect(layout.moods[3]!.pairs[0]![0]!.rows.map((b) => [b.label, b.shown])).toEqual([
      ['(du)', ['mach', 'mache']],
      ['(ihr)', ['macht']],
    ]);
    expect(layout.moods[4]!.pairs[0]![0]!.rows.map((b) => [b.label, b.shown])).toEqual([
      ['Partizip I', ['machend']],
      ['Partizip II', ['gemacht']],
    ]);
  });
});
