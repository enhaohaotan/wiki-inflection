import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../../core/types';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { parseGermanVerbTables } from './parse';

// Real pages saved from the Core REST API (/w/rest.php/v1/page/{title}/html).
function load(word: string): InflectionTable[] {
  const html = readFileSync(resolve(process.cwd(), 'test/fixtures/de', `${word}.html`), 'utf8');
  const section = findLanguageSection(parsePage(html), 'German');
  if (!section) throw new Error(`no German section in ${word}`);
  return parseGermanVerbTables(section, word);
}

function forms(table: InflectionTable, ...tags: string[]): string[] | undefined {
  return table.inflections.find((i) => i.tags.join('|') === tags.join('|'))?.forms;
}

describe('parseGermanVerbTables', () => {
  it('reads a weak verb (machen)', () => {
    const tables = load('machen');
    expect(tables).toHaveLength(1);
    const t = tables[0]!;
    expect(t.lemma).toBe('machen');
    expect(t.meta.class).toBe('weak');
    expect(forms(t, 'aux')).toEqual(['haben']);
    expect(forms(t, 'past', 'part')).toEqual(['gemacht']);
    expect(forms(t, '2', 's', 'pres')).toEqual(['machst']);
    expect(forms(t, '3', 's', 'pret')).toEqual(['machte']);
    expect(forms(t, '2', 's', 'sub:I')).toEqual(['machest']);
    expect(forms(t, '2', 's', 'imp')).toEqual(['mach', 'mache']);
    expect(forms(t, '2', 'p', 'imp')).toEqual(['macht']);
  });

  it('reads a strong verb (fahren, sprechen)', () => {
    const [fahren] = load('fahren');
    expect(fahren!.meta.class).toContain('strong');
    expect(forms(fahren!, '2', 's', 'pres')).toEqual(['fährst']);
    expect(forms(fahren!, '1', 's', 'pret')).toEqual(['fuhr']);
    expect(forms(fahren!, '1', 's', 'sub:II')).toEqual(['führe']);
    const [sprechen] = load('sprechen');
    expect(forms(sprechen!, '2', 's', 'imp')).toEqual(['sprich']);
  });

  it('reads a separable verb, with both auxiliaries (anfangen)', () => {
    const [t] = load('anfangen');
    expect(t!.meta.class).toBe('class 7 strong');
    // sein only in Northwest German, says the footnote.
    expect(forms(t!, 'aux')).toEqual(['haben']);
    expect(forms(t!, 'aux', 'rare')).toEqual(['sein']);
    expect(forms(t!, '1', 's', 'pres')).toEqual(['fange an']);
    expect(forms(t!, 'past', 'part')).toEqual(['angefangen']);
    expect(forms(t!, '2', 's', 'sub:II')).toEqual(['fingest an', 'fingst an']);
  });

  it('reads sein', () => {
    const [t] = load('sein');
    expect(t!.meta.class).toBe('irregular');
    expect(forms(t!, 'aux')).toEqual(['sein']);
    expect(forms(t!, '1', 's', 'pres')).toEqual(['bin']);
    expect(forms(t!, '3', 's', 'sub:II')).toEqual(['wäre']);
  });
});
