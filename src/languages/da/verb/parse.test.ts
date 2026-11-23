import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../../core/types';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { danish } from '..';
import { layoutDanishVerb } from './layout';
import { parseDanishVerbTables } from './parse';

function section(name: string): Element {
  const html = readFileSync(resolve(process.cwd(), 'test/fixtures/da', `${name}.html`), 'utf8');
  const found = findLanguageSection(parsePage(html), 'Danish');
  if (!found) throw new Error(`no Danish section in ${name}`);
  return found;
}

const load = (verb: string): InflectionTable[] => parseDanishVerbTables(section(verb), verb);

describe('parseDanishVerbTables', () => {
  it('lists active, passive and participle separately (spise)', () => {
    const [t] = load('spise');
    expect(t!.lemma).toBe('spise');
    expect(layoutDanishVerb(t!)).toEqual({
      lemma: 'spise',
      sections: [
        {
          rows: [
            { label: 'Infinitiv', forms: ['spise'] },
            { label: 'Præsens', forms: ['spiser'] },
            { label: 'Præteritum', forms: ['spiste'] },
            { label: 'Perfektum', forms: ['spist'] },
            { label: 'Imperativ', forms: ['spis'] },
          ],
        },
        {
          title: 'Passiv',
          rows: [
            { label: 'Infinitiv', forms: ['spises'] },
            { label: 'Præsens', forms: ['spises'] },
            { label: 'Præteritum', forms: ['spistes'] },
          ],
        },
        { title: 'Participium', rows: [{ label: 'Præsens', forms: ['spisende'] }] },
      ],
    });
  });

  it('tags untagged forms from their row and column (være: er)', () => {
    const c = layoutDanishVerb(load('være')[0]!);
    expect(c.sections[0]!.rows[1]).toEqual({ label: 'Præsens', forms: ['er'] });
    expect(c.sections[1]!.rows[2]).toEqual({ label: 'Præteritum', forms: [] });
  });

  it('keeps the auxiliary of the past participle in the data (gå takes være)', () => {
    const [t] = load('gå');
    expect(layoutDanishVerb(t!).sections[0]!.rows[3]).toEqual({ label: 'Perfektum', forms: ['gået'] });
    expect(t!.meta.auxiliary).toBe('er / var');
  });

  it('treats dashes as missing forms and drops empty sections (synes)', () => {
    const c = layoutDanishVerb(load('synes')[0]!);
    expect(c.sections.map((s) => s.title)).toEqual([undefined]);
    expect(c.sections[0]!.rows[4]).toEqual({ label: 'Imperativ', forms: [] });
  });

  it('finds the verb among other parts of speech (have is also a noun)', () => {
    expect(load('have').map((t) => t.lemma)).toEqual(['have']);
  });

  it('points inflected forms to their verb', () => {
    expect(danish.lemmasOf!(section('form-gik'), 'gik')).toEqual(['gå']);
    expect(danish.lemmasOf!(section('form-spiser'), 'spiser')).toEqual(['spise']);
    expect(danish.lemmasOf!(section('form-er'), 'er')).toEqual(['være']);
  });
});

describe('Danish lookup', () => {
  // Serves pages from test/fixtures/da: verbs as "<title>.html", forms as "form-<title>.html".
  async function withPages<T>(run: () => Promise<T>): Promise<T> {
    const { readdirSync } = await import('node:fs');
    const { vi } = await import('vitest');
    const dir = resolve(process.cwd(), 'test/fixtures/da');
    // Compare names exactly: the file system may ignore case, Wiktionary does not.
    const files = new Set(readdirSync(dir).map((f) => f.normalize('NFC')));
    localStorage.clear();
    vi.stubGlobal('fetch', async (url: string) => {
      const title = decodeURIComponent(url.match(/\/page\/([^/]+)\/html/)![1]!).replace(/_/g, ' ');
      for (const name of [title, `form-${title}`]) {
        const file = `${name}.html`.normalize('NFC');
        if (files.has(file)) return new Response(readFileSync(resolve(dir, file), 'utf8'), { status: 200 });
      }
      return new Response('', { status: 404 });
    });
    try {
      return await run();
    } finally {
      vi.unstubAllGlobals();
    }
  }

  it('looks up a verb directly', async () => {
    const { lookup } = await import('../../../features/lookup/lookup');
    const result = await withPages(() => lookup(danish, 'spise'));
    expect(result.status === 'ok' && result.entry.tables[0]!.lemma).toBe('spise');
  });

  it('finds the verb of an inflected form, case-insensitively', async () => {
    const { lookup } = await import('../../../features/lookup/lookup');
    const result = await withPages(() => lookup(danish, 'Gik'));
    expect(result.status === 'ok' && result.entry.title).toBe('gå');
    expect(result.status === 'ok' && result.match?.form).toBe('gik');
  });
});
