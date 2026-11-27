import { describe, expect, it } from 'vitest';
import { conjugationLayout } from '../../languages/es/verb/layout';
import { parseSpanishVerbTables } from '../../languages/es/verb/parse';
import { fixtureLoader, sheetBuilder, tense } from '../testing';

const load = fixtureLoader('es', 'Spanish', parseSpanishVerbTables);
const buildSheet = sheetBuilder(conjugationLayout);

describe('buildSheet', () => {
  it('lays out the moods and tenses, the compound tenses and the future subjunctive folded', () => {
    const sheet = buildSheet(load('hablar'));
    expect(sheet.sections.map((s) => s.name)).toEqual([
      'Indicativo',
      'Condicional',
      'Subjuntivo',
      'Imperativo',
      'Formas no personales',
    ]);
    const subjuntivo = sheet.sections[2]!.pairs.flat();
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
    const sheet = buildSheet(load('hablar'));
    expect(tense(sheet, 'indicativo', 'Pretérito perfecto').map((b) => [b.label, b.forms])).toEqual([
      ['yo', ['he hablado']],
      ['tú', ['has hablado']],
      ['él/ella', ['ha hablado']],
      ['nosotros', ['hemos hablado']],
      ['vosotros', ['habéis hablado']],
      ['ellos/ellas', ['han hablado']],
    ]);
  });

  it('takes both forms of the imperfect subjunctive', () => {
    const sheet = buildSheet(load('hablar'));
    const simple = tense(sheet, 'subjuntivo', 'Pretérito imperfecto');
    expect(simple[0]!.label).toBe('que yo');
    expect(simple[0]!.forms).toEqual(['hablara', 'hablase']);
    const compound = tense(sheet, 'subjuntivo', 'Pretérito pluscuamperfecto');
    expect(compound[3]!.forms).toEqual(['hubiéramos hablado', 'hubiésemos hablado']);
  });

  it('asks for the imperative of tú, usted, nosotros, vosotros, ustedes', () => {
    const blanks = tense(buildSheet(load('hablar')), 'imperativo', 'Afirmativo');
    expect(blanks.map((b) => [b.label, b.forms])).toEqual([
      ['(tú)', ['habla']],
      ['(usted)', ['hable']],
      ['(nosotros)', ['hablemos']],
      ['(vosotros)', ['hablad']],
      ['(ustedes)', ['hablen']],
    ]);
  });

  it('puts the reflexive pronoun before haber (llamarse)', () => {
    const sheet = buildSheet(load('llamarse'));
    expect(tense(sheet, 'indicativo', 'Presente')[0]!.forms).toEqual(['me llamo']);
    expect(tense(sheet, 'indicativo', 'Pretérito perfecto').map((b) => b.forms[0])).toEqual([
      'me he llamado',
      'te has llamado',
      'se ha llamado',
      'nos hemos llamado',
      'os habéis llamado',
      'se han llamado',
    ]);
    const forms = sheet.sections.at(-1)!.pairs[0]![0]!.blanks;
    expect(forms.map((b) => [b.label, b.forms])).toEqual([
      ['gerundio', ['llamándose']],
      ['participio', ['llamado']],
    ]);
    expect(forms[1]!.accepted).toEqual(['llamado', 'llamada', 'llamados', 'llamadas']);
  });
});
