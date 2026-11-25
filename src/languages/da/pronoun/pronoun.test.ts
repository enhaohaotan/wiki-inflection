import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from '../../../features/lookup/lookup';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { danish } from '..';
import { layoutPersonal } from './layout';
import { findPersonalTable, parsePersonalRows } from './parse';

const DIR = resolve(process.cwd(), 'test/fixtures/da');

function section(name: string): Element {
  const html = readFileSync(resolve(DIR, `${name}.html`), 'utf8');
  return findLanguageSection(parsePage(html), 'Danish')!;
}

const pronouns = (name: string, title = name) =>
  danish.parse(section(name), title).tables.filter((t) => t.pos === 'pronoun');

describe('Danish personal pronouns', () => {
  const rows = parsePersonalRows(findPersonalTable(section('jeg'))!);
  const row = (nominative: string) => rows.find((r) => r.nominative === nominative);

  it('reads every person with its object and possessive forms', () => {
    expect(row('jeg')).toEqual({ number: 'singular', nominative: 'jeg', oblique: 'mig', possessive: ['min', 'mit', 'mine'] });
    expect(row('han')).toEqual({ number: 'singular', nominative: 'han', oblique: 'ham', possessive: ['hans'] });
    expect(row('de')).toEqual({ number: 'plural', nominative: 'de', oblique: 'dem', possessive: ['deres'] });
  });

  it('marks formal, archaic and reflexive rows', () => {
    expect(row('De')!.note).toBe('formal');
    expect(row('du')!.note).toBeUndefined(); // "informal" is not "formal"
    expect(rows.filter((r) => r.note === 'reflexive').map((r) => r.oblique)).toEqual(['sig', 'sig']);
  });

  it('does not repeat merged cells in the next row (vi spans two rows)', () => {
    const archaic = rows.find((r) => r.note === 'archaic')!;
    expect(archaic).toEqual({
      number: 'plural',
      note: 'archaic',
      nominative: null,
      oblique: null,
      possessive: ['vor', 'vort', 'vore'],
    });
    expect(row('vi')!.possessive).toEqual(['vores']);
  });

  it('lays out singular, plural, then De and vor after a rule, then the reflexive', () => {
    const layout = layoutPersonal(rows);
    expect(layout.singular.map((l) => l.nominative)).toEqual(['jeg', 'du', 'han', 'hun', 'den', 'det', 'man']);
    expect(layout.plural.map((l) => l.nominative)).toEqual(['vi', 'I', 'de']);
    expect(layout.other).toEqual([
      { nominative: 'De', oblique: 'Dem', possessive: ['Deres'] },
      { nominative: null, oblique: null, possessive: ['vor', 'vort', 'vore'] },
    ]);
    expect(layout.reflexive).toEqual({ nominative: null, oblique: 'sig', possessive: ['sin', 'sit', 'sine'] });
  });

  it('shows the table on any personal pronoun page, including object forms', () => {
    expect(pronouns('jeg').map((t) => t.meta.kind)).toEqual(['personal']);
    expect(pronouns('form-mig', 'mig').map((t) => t.lemma)).toEqual(['mig']);
    expect(pronouns('min').map((t) => t.meta.kind)).toEqual(['personal']);
  });
});

describe('Danish gendered pronouns', () => {
  it('reads neuter and plural from the headword (denne)', () => {
    const [t] = pronouns('denne');
    expect(Object.fromEntries(t!.inflections.map((i) => [i.tags[0], i.forms]))).toEqual({
      common: ['denne'],
      neuter: ['dette'],
      plural: ['disse'],
    });
  });

  it('keeps alternative plurals (nogen: nogle or nogen)', () => {
    expect(pronouns('nogen')[0]!.inflections.find((i) => i.tags[0] === 'plural')!.forms).toEqual(['nogle', 'nogen']);
  });
});

describe('Danish pronoun lookup', () => {
  const files = new Set(readdirSync(DIR).map((f) => f.normalize('NFC')));

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', async (url: string) => {
      const title = decodeURIComponent(url.match(/\/page\/([^/]+)\/html/)![1]!).replace(/_/g, ' ');
      for (const name of [title, `form-${title}`]) {
        const file = `${name}.html`.normalize('NFC');
        if (files.has(file)) return new Response(readFileSync(resolve(DIR, file), 'utf8'), { status: 200 });
      }
      return new Response('', { status: 404 });
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('finds the table from an object form whose page has no form-of link (dem)', async () => {
    const result = await lookup(danish, 'dem');
    expect(result.status === 'ok' && result.entry.tables[0]!.meta.kind).toBe('personal');
  });

  it('finds the gendered pronoun of a form (dette -> denne)', async () => {
    const result = await lookup(danish, 'dette');
    expect(result.status === 'ok' && result.entry.title).toBe('denne');
  });
});
