import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../core/types';
import { parseSpanishVerbTables } from '../../languages/es/verb/parse';
import { findLanguageSection, parsePage } from '../../wiktionary/page';
import type { Blank, Sheet } from '../types';
import { kindOf } from './kinds';
import { attach, reflexiveTable } from './reflexive';
import { buildSheet } from './sheet';

function load(word: string, lemma = word): InflectionTable {
  const html = readFileSync(resolve(process.cwd(), 'test/fixtures/es', `${word}.html`), 'utf8');
  const tables = parseSpanishVerbTables(findLanguageSection(parsePage(html), 'Spanish')!, word);
  return tables.find((t) => t.lemma === lemma)!;
}

function tense(sheet: Sheet, mood: string, name: string): Blank[] {
  const section = sheet.sections.find((s) => s.id === mood)!;
  return section.pairs.flat().find((e) => e.name === name)!.blanks;
}

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

describe('kindOf', () => {
  it('goes by the class Wiktionary gives the table', () => {
    expect(kindOf('ser', load('ser'))).toBe('irregular');
    expect(kindOf('sentir', load('sentir'))).toBe('spelling');
    expect(kindOf('hablar', load('hablar'))).toBe('regular');
    expect(kindOf('buscar', undefined)).toBe('spelling');
  });
});

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
