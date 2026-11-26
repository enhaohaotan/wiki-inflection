import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../../core/types';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { parseSpanishVerbTables } from './parse';

// Real pages saved from the Core REST API (/w/rest.php/v1/page/{title}/html).
function load(word: string): InflectionTable[] {
  const html = readFileSync(resolve(process.cwd(), 'test/fixtures/es', `${word}.html`), 'utf8');
  const section = findLanguageSection(parsePage(html), 'Spanish');
  if (!section) throw new Error(`no Spanish section in ${word}`);
  return parseSpanishVerbTables(section, word);
}

function forms(table: InflectionTable, ...tags: string[]): string[] | undefined {
  return table.inflections.find((i) => i.tags.join('|') === tags.join('|'))?.forms;
}

describe('parseSpanishVerbTables', () => {
  it('reads a regular verb and its reflexive table on the same page (hablar, hablarse)', () => {
    const tables = load('hablar');
    expect(tables.map((t) => t.lemma)).toEqual(['hablar', 'hablarse']);
    const t = tables[0]!;
    expect(t.meta.class).toBeUndefined();
    expect(forms(t, 'ger')).toEqual(['hablando']);
    expect(forms(t, 'pp', 'm', 's')).toEqual(['hablado']);
    expect(forms(t, 'pp', 'f', 'p')).toEqual(['habladas']);
    // The tú form only, not the voseo one (hablás).
    expect(forms(t, '2', 's', 'pres', 'ind')).toEqual(['hablas']);
    expect(forms(t, '1', 'p', 'impf', 'ind')).toEqual(['hablábamos']);
    expect(forms(t, '3', 's', 'pret')).toEqual(['habló']);
    expect(forms(t, '1', 's', 'fut', 'ind')).toEqual(['hablaré']);
    expect(forms(t, '2', 'p', 'cond')).toEqual(['hablaríais']);
    expect(forms(t, '2', 's', 'pres', 'sub')).toEqual(['hables']);
    expect(forms(t, '1', 'p', 'impf', 'sub', 'ra')).toEqual(['habláramos']);
    expect(forms(t, '1', 'p', 'impf', 'sub', 'se')).toEqual(['hablásemos']);
    expect(forms(t, '3', 'p', 'fut', 'sub')).toEqual(['hablaren']);
    expect(forms(t, '2', 's', 'imp')).toEqual(['habla']);
    expect(forms(t, '3', 's', 'imp')).toEqual(['hable']);
    expect(forms(t, '2', 'p', 'imp')).toEqual(['hablad']);
    expect(forms(t, '1', 's', 'imp')).toBeUndefined();
  });

  it('reads a reflexive verb (llamarse)', () => {
    const [t] = load('llamarse');
    expect(t!.lemma).toBe('llamarse');
    expect(forms(t!, '1', 's', 'pres', 'ind')).toEqual(['me llamo']);
    expect(forms(t!, '2', 's', 'pres', 'ind')).toEqual(['te llamas']);
    expect(forms(t!, '2', 's', 'imp')).toEqual(['llámate']);
    expect(forms(t!, '1', 'p', 'imp')).toEqual(['llamémonos']);
    expect(forms(t!, '2', 'p', 'imp')).toEqual(['llamaos']);
    expect(forms(t!, 'ger')).toEqual(['llamándose']);
    expect(forms(t!, 'pp', 'm', 's')).toEqual(['llamado']);
  });

  it('reads irregular verbs and their class', () => {
    const [ser] = load('ser');
    expect(ser!.meta.class).toBe('irregular');
    expect(forms(ser!, '2', 's', 'pres', 'ind')).toEqual(['eres']);
    expect(forms(ser!, '1', 's', 'pret')).toEqual(['fui']);
    expect(forms(ser!, '2', 's', 'imp')).toEqual(['sé']);

    const [ir, irse] = load('ir');
    expect(ir!.lemma).toBe('ir');
    expect(irse!.lemma).toBe('irse');
    expect(forms(ir!, '1', 's', 'pres', 'ind')).toEqual(['voy']);
    expect(forms(irse!, '1', 's', 'pres', 'ind')).toEqual(['me voy']);

    const [sentir] = load('sentir');
    expect(sentir!.meta.class).toBe('e-ie-i alternation');
    expect(forms(sentir!, '3', 's', 'pret')).toEqual(['sintió']);
  });
});
