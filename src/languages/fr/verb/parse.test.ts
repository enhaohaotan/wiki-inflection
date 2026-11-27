import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../../core/types';
import { findLanguageSection, listLanguages, parsePage } from '../../../wiktionary/page';
import { french } from '..';
import { parseFrenchVerbTables } from './parse';

// Real pages saved from the Core REST API (/w/rest.php/v1/page/{title}/html).
function fixture(word: string): string {
  return readFileSync(resolve(process.cwd(), 'test/fixtures/fr', `${word}.html`), 'utf8');
}

function load(word: string): InflectionTable[] {
  const section = findLanguageSection(parsePage(fixture(word)), 'French');
  if (!section) throw new Error(`no French section in ${word}`);
  return parseFrenchVerbTables(section, word);
}

function forms(table: InflectionTable, ...tags: string[]): string[] | undefined {
  return table.inflections.find((i) => i.tags.join('|') === tags.join('|'))?.forms;
}

describe('page structure', () => {
  it('finds the French section among many languages', () => {
    const doc = parsePage(fixture('aller'));
    expect(listLanguages(doc)).toEqual(expect.arrayContaining(['Dutch', 'French', 'German']));
    expect(findLanguageSection(doc, 'French')).not.toBeNull();
    expect(findLanguageSection(doc, 'Klingon')).toBeNull();
  });
});

describe('parseFrenchVerbTables', () => {
  it('reads an irregular verb (aller)', () => {
    const tables = load('aller');
    expect(tables).toHaveLength(1);
    const t = tables[0]!;
    expect(t.lemma).toBe('aller');
    expect(t.title).toBe('Conjugation of aller');
    expect(t.meta.auxiliary).toBe('être');
    expect(forms(t, 'inf')).toEqual(['aller']);
    expect(forms(t, 'ppr')).toEqual(['allant']);
    expect(forms(t, 'pp')).toEqual(['allé']);
    expect(forms(t, '1', 's', 'pres', 'indc')).toEqual(['vais']);
    expect(forms(t, '3', 'p', 'pres', 'indc')).toEqual(['vont']);
    expect(forms(t, '1', 's', 'futr')).toEqual(['irai']);
    expect(forms(t, '2', 'p', 'cond')).toEqual(['iriez']);
    expect(forms(t, '3', 's', 'impf', 'subj')).toEqual(['allât']);
    expect(forms(t, '2', 's', 'impr')).toEqual(['va']);
    // 2 participles + infinitive + 7 six-person tenses + 3 imperatives
    expect(t.inflections).toHaveLength(3 + 7 * 6 + 3);
    expect(t.notes[0]).toMatch(/highly irregular/);
  });

  it('keeps the pronunciation of each form', () => {
    const t = load('aller')[0]!;
    const slot = t.inflections.find((i) => i.tags.join('|') === '1|s|pres|indc');
    expect(slot?.ipa).toEqual(['/vɛ/']);
  });

  it('reads compound tenses as rules', () => {
    const t = load('aller')[0]!;
    const byKey = Object.fromEntries(t.periphrastic.map((p) => [p.key, p]));
    expect(byKey['indicative:present perfect']).toMatchObject({
      nativeLabel: 'passé composé',
      rule: 'present indicative of être + past participle',
    });
    expect(byKey['subjunctive:past']?.rule).toBe('present subjunctive of être + past participle');
    expect(byKey['imperative:compound']?.rule).toBe('simple imperative of être + past participle');
    expect(byKey['nonfinite:infinitive']?.rule).toBe('être + past participle');
    expect(t.periphrastic).toHaveLength(10);
  });

  it('reads regular verbs with avoir (manger, finir)', () => {
    const manger = load('manger')[0]!;
    expect(manger.meta.auxiliary).toBe('avoir');
    expect(forms(manger, '1', 'p', 'pres', 'indc')).toEqual(['mangeons']);
    const finir = load('finir')[0]!;
    expect(forms(finir, '1', 'p', 'pres', 'indc')).toEqual(['finissons']);
    expect(forms(finir, 'pp')).toEqual(['fini']);
  });

  it('leaves out the persons a defective verb lacks (pleuvoir)', () => {
    const t = load('pleuvoir')[0]!;
    expect(forms(t, '3', 's', 'pres', 'indc')).toEqual(['pleut']);
    expect(forms(t, '1', 's', 'pres', 'indc')).toBeUndefined();
    expect(forms(t, '2', 's', 'impr')).toBeUndefined();
  });

  it('keeps variant forms and every table on the page (asseoir)', () => {
    const tables = load('asseoir');
    expect(tables.map((t) => t.title)).toEqual(['Conjugation of asseoir', "Conjugation of s'asseoir"]);
    const slot = tables[0]!.inflections.find((i) => i.tags.join('|') === '1|p|pres|indc');
    expect(slot?.forms).toEqual(['assoyons', 'asseyons']);
    // Pronunciations do not pair 1:1 with spellings here.
    expect(slot?.ipa).toHaveLength(3);
  });

  it('reads a reflexive table whose cells carry no grammar tags (s\'asseoir)', () => {
    const t = load('asseoir')[1]!;
    expect(t.lemma).toBe("s'asseoir");
    expect(forms(t, '1', 's', 'pres', 'indc')).toEqual(["m'assois", "m'assieds"]);
    expect(forms(t, '1', 'p', 'futr')).toEqual(['nous assoirons', 'nous assiérons']);
    expect(forms(t, '2', 's', 'impr')).toEqual(['assois-toi', 'assieds-toi']);
    expect(forms(t, 'ppr')).toEqual(["s'assoyant", "s'asseyant"]);
    expect(forms(t, 'pp')).toEqual(['assis']);
    expect(t.inflections).toHaveLength(3 + 7 * 6 + 3);
  });

  it('puts the conjugation that was asked for first', () => {
    const section = findLanguageSection(parsePage(fixture('asseoir')), 'French')!;
    expect(french.parse(section, 'asseoir').tables.map((t) => t.lemma)).toEqual(['asseoir', "s'asseoir"]);
    expect(french.parse(section, "s'asseoir").tables.map((t) => t.lemma)).toEqual(["s'asseoir", 'asseoir']);
  });

  it('finds the table when the verb sits under a numbered etymology (voler)', () => {
    const tables = load('voler');
    expect(tables).toHaveLength(1);
    expect(forms(tables[0]!, '3', 's', 'pres', 'indc')).toEqual(['vole']);
  });

  it('returns nothing for a French word that is not a verb (chat)', () => {
    expect(load('chat')).toEqual([]);
  });
});
