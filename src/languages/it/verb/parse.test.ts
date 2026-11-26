import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../../core/types';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { parseItalianVerbTables, plainSpelling } from './parse';

// Real pages saved from the Core REST API (/w/rest.php/v1/page/{title}/html).
function load(word: string): InflectionTable[] {
  const html = readFileSync(resolve(process.cwd(), 'test/fixtures/it', `${word}.html`), 'utf8');
  const section = findLanguageSection(parsePage(html), 'Italian');
  if (!section) throw new Error(`no Italian section in ${word}`);
  return parseItalianVerbTables(section, word);
}

function forms(table: InflectionTable, ...tags: string[]): string[] | undefined {
  return table.inflections.find((i) => i.tags.join('|') === tags.join('|'))?.forms;
}

describe('plainSpelling', () => {
  it('drops teaching accents but keeps the written ones', () => {
    expect(plainSpelling('chiamerémo')).toBe('chiameremo');
    expect(plainSpelling('pàrlino')).toBe('parlino');
    expect(plainSpelling('parlò')).toBe('parlò');
    expect(plainSpelling('è')).toBe('è');
    expect(plainSpelling('mi chiàmo')).toBe('mi chiamo');
  });
});

describe('parseItalianVerbTables', () => {
  it('reads a regular verb (parlare)', () => {
    const [t] = load('parlare');
    expect(t!.lemma).toBe('parlare');
    expect(t!.meta.class).toBe('-are');
    expect(forms(t!, 'aux')).toEqual(['avere']);
    expect(forms(t!, 'ger')).toEqual(['parlando']);
    expect(forms(t!, 'past', 'part')).toEqual(['parlato']);
    expect(forms(t!, '1', 's', 'pres', 'ind')).toEqual(['parlo']);
    expect(forms(t!, '3', 'p', 'pres', 'ind')).toEqual(['parlano']);
    expect(forms(t!, '1', 'p', 'impf', 'ind')).toEqual(['parlavamo']);
    expect(forms(t!, '3', 's', 'phis')).toEqual(['parlò']);
    expect(forms(t!, '1', 'p', 'fut')).toEqual(['parleremo']);
    expect(forms(t!, '3', 's', 'cond')).toEqual(['parlerebbe']);
    expect(forms(t!, '3', 'p', 'pres', 'sub')).toEqual(['parlino']);
    expect(forms(t!, '1', 's', 'impf', 'sub')).toEqual(['parlassi']);
    expect(forms(t!, '2', 's', 'imp')).toEqual(['parla']);
    expect(forms(t!, '1', 'p', 'imp')).toEqual(['parliamo']);
    expect(forms(t!, '2', 'p', 'imp')).toEqual(['parlate']);
    expect(forms(t!, '1', 's', 'imp')).toBeUndefined();
  });

  it('reads a reflexive verb, whose forms carry no grammar tags (chiamarsi)', () => {
    const [t] = load('chiamarsi');
    expect(t!.lemma).toBe('chiamarsi');
    expect(forms(t!, 'aux')).toEqual(['essere']);
    expect(forms(t!, '1', 's', 'pres', 'ind')).toEqual(['mi chiamo']);
    expect(forms(t!, '1', 'p', 'pres', 'ind')).toEqual(['ci chiamiamo']);
    expect(forms(t!, '2', 's', 'imp')).toEqual(['chiamati']);
    expect(forms(t!, '1', 'p', 'imp')).toEqual(['chiamiamoci']);
    expect(forms(t!, '2', 'p', 'imp')).toEqual(['chiamatevi']);
  });

  it('reads an irregular verb with essere (andare)', () => {
    const [t] = load('andare');
    expect(t!.lemma).toBe('andare');
    expect(t!.meta.class).toContain('irregular');
    expect(forms(t!, 'aux')).toEqual(['essere']);
    expect(forms(t!, '1', 's', 'pres', 'ind')).toEqual(expect.arrayContaining(['vado']));
    expect(forms(t!, '1', 's', 'fut')).toEqual(['andrò']);
    expect(forms(t!, '2', 's', 'imp')).toEqual(expect.arrayContaining(["va'"]));
    expect(forms(t!, 'past', 'part')).toEqual(['andato']);
  });

  it('reads essere', () => {
    const [t] = load('essere');
    expect(forms(t!, '3', 's', 'pres', 'ind')).toEqual(['è']);
    expect(forms(t!, '1', 's', 'phis')).toEqual(['fui']);
    expect(forms(t!, '1', 's', 'impf', 'sub')).toEqual(['fossi']);
  });

  it('reads both auxiliaries when a verb takes either (finire)', () => {
    const tables = load('finire');
    expect(tables[0]!.lemma).toBe('finire');
    expect(forms(tables[0]!, 'aux')).toEqual(['avere', 'essere']);
    expect(forms(tables[0]!, '1', 's', 'pres', 'ind')).toEqual(['finisco']);
  });

  it('reads a verb only used as a reflexive (accorgersi)', () => {
    const [t] = load('accorgersi');
    expect(t!.lemma).toBe('accorgersi');
    expect(forms(t!, '1', 's', 'pres', 'ind')).toEqual(['mi accorgo']);
    expect(forms(t!, '1', 's', 'phis')).toEqual(['mi accorsi']);
  });
});
