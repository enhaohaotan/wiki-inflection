import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from '../../../features/lookup/lookup';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { danish } from '..';
import { layoutDanishAdjective } from './layout';

const DIR = resolve(process.cwd(), 'test/fixtures/da');

function adjective(word: string) {
  const html = readFileSync(resolve(DIR, `${word}.html`), 'utf8');
  const section = findLanguageSection(parsePage(html), 'Danish')!;
  const table = danish.parse(section, word).tables.find((t) => t.pos === 'adjective');
  if (!table) throw new Error(`no adjective in ${word}`);
  return layoutDanishAdjective(table);
}

const row = (a: ReturnType<typeof adjective>, label: string) => a.rows.find((r) => r.label === label);

describe('Danish adjectives', () => {
  it('reads tagged headword forms (stor)', () => {
    expect(adjective('stor')).toEqual({
      lemma: 'stor',
      rows: [
        { label: 'Fælleskøn', indefinite: ['stor'], definite: ['store'] },
        { label: 'Intetkøn', indefinite: ['stort'], definite: ['store'] },
        { label: 'Flertal', indefinite: ['store'], definite: ['store'] },
        { label: 'Komparativ', indefinite: ['større'], definite: ['større'] },
        { label: 'Superlativ', indefinite: ['størst'], definite: ['største'] },
      ],
    });
  });

  it('keeps irregular comparison (god: bedre, bedst)', () => {
    const a = adjective('god');
    expect(row(a, 'Komparativ')!.indefinite).toEqual(['bedre']);
    expect(row(a, 'Superlativ')).toEqual({ label: 'Superlativ', indefinite: ['bedst'], definite: ['bedste'] });
  });

  it('reads untagged forms by their labels (lille: små)', () => {
    const a = adjective('lille');
    expect(row(a, 'Intetkøn')).toEqual({ label: 'Intetkøn', indefinite: ['lille'], definite: ['lille'] });
    expect(row(a, 'Flertal')!.indefinite).toEqual(['små']);
    expect(row(a, 'Komparativ')!.indefinite).toEqual(['mindre']);
  });

  it('reads an inflection table when there is one (interessant)', () => {
    const a = adjective('interessant');
    expect(row(a, 'Intetkøn')!.indefinite).toEqual(['interessant']);
    expect(row(a, 'Flertal')!.indefinite).toEqual(['interessante']);
    expect(row(a, 'Komparativ')!.indefinite).toEqual(['interessantere']);
    expect(row(a, 'Superlativ')).toEqual({
      label: 'Superlativ',
      indefinite: ['interessantest'],
      definite: ['interessanteste'],
    });
  });

  it('leaves out degrees Wiktionary does not give (blå)', () => {
    expect(adjective('blå').rows.map((r) => r.label)).toEqual(['Fælleskøn', 'Intetkøn', 'Flertal']);
  });
});

describe('Danish adjective lookup', () => {
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

  it('finds the adjective of a comparative (større -> stor)', async () => {
    const result = await lookup(danish, 'større');
    expect(result.status === 'ok' && result.entry.title).toBe('stor');
  });

  it('shows a word that is both an entry and a form of another (små, and lille)', async () => {
    const result = await lookup(danish, 'små');
    expect(result.status === 'ok' && result.match?.entries.map((e) => e.title)).toEqual(['små', 'lille']);
    const chosen = await lookup(danish, 'små', undefined, 'lille');
    expect(chosen.status === 'ok' && chosen.entry.title).toBe('lille');
  });
});
