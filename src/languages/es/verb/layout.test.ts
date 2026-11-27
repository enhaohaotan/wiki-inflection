import { describe, expect, it } from 'vitest';
import { fixtureLoader, tenseIn } from '../../testing';
import { spanish } from '..';
import { conjugationLayout } from './layout';

const load = fixtureLoader(spanish);

describe('conjugationLayout', () => {
  it('lays out the moods and tenses, the compound tenses and the future subjunctive folded', () => {
    const layout = conjugationLayout(load('hablar'));
    expect(layout.moods.map((s) => s.name)).toEqual([
      'Indicativo',
      'Condicional',
      'Subjuntivo',
      'Imperativo',
      'Formas no personales',
    ]);
    const subjuntivo = layout.moods[2]!.pairs.flat();
    expect(subjuntivo.map((e) => [e.name, e.folded])).toEqual([
      ['Presente', false],
      ['Pretérito perfecto', true],
      ['Pretérito imperfecto', false],
      ['Pretérito pluscuamperfecto', true],
      ['Futuro', true],
      ['Futuro perfecto', true],
    ]);
  });

  it('builds the compound tenses with haber', () => {
    const layout = conjugationLayout(load('hablar'));
    expect(tenseIn(layout, 'indicativo', 'Pretérito perfecto').map((b) => [b.label, b.shown])).toEqual([
      ['yo', ['he hablado']],
      ['tú', ['has hablado']],
      ['él/ella', ['ha hablado']],
      ['nosotros', ['hemos hablado']],
      ['vosotros', ['habéis hablado']],
      ['ellos/ellas', ['han hablado']],
    ]);
  });

  it('takes both forms of the imperfect subjunctive', () => {
    const layout = conjugationLayout(load('hablar'));
    const simple = tenseIn(layout, 'subjuntivo', 'Pretérito imperfecto');
    expect(simple[0]!.label).toBe('que yo');
    expect(simple[0]!.shown).toEqual(['hablara', 'hablase']);
    const compound = tenseIn(layout, 'subjuntivo', 'Pretérito pluscuamperfecto');
    expect(compound[3]!.shown).toEqual(['hubiéramos hablado', 'hubiésemos hablado']);
  });

  it('asks for the imperative of tú, usted, nosotros, vosotros, ustedes', () => {
    const blanks = tenseIn(conjugationLayout(load('hablar')), 'imperativo', 'Afirmativo');
    expect(blanks.map((b) => [b.label, b.shown])).toEqual([
      ['(tú)', ['habla']],
      ['(usted)', ['hable']],
      ['(nosotros)', ['hablemos']],
      ['(vosotros)', ['hablad']],
      ['(ustedes)', ['hablen']],
    ]);
  });

  it('puts the reflexive pronoun before haber (llamarse)', () => {
    const layout = conjugationLayout(load('llamarse'));
    expect(tenseIn(layout, 'indicativo', 'Presente')[0]!.shown).toEqual(['me llamo']);
    expect(tenseIn(layout, 'indicativo', 'Pretérito perfecto').map((b) => b.shown[0])).toEqual([
      'me he llamado',
      'te has llamado',
      'se ha llamado',
      'nos hemos llamado',
      'os habéis llamado',
      'se han llamado',
    ]);
    const forms = layout.moods.at(-1)!.pairs[0]![0]!.rows;
    expect(forms.map((b) => [b.label, b.shown])).toEqual([
      ['gerundio', ['llamándose']],
      ['participio', ['llamado']],
    ]);
    expect(forms[1]!.accepted).toEqual(['llamado', 'llamada', 'llamados', 'llamadas']);
  });
});
