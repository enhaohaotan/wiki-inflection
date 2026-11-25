import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from '../../../features/lookup/lookup';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { danish } from '..';

const DIR = resolve(process.cwd(), 'test/fixtures/da');

function adverbs(word: string) {
  const html = readFileSync(resolve(DIR, `${word}.html`), 'utf8');
  const section = findLanguageSection(parsePage(html), 'Danish')!;
  return danish.parse(section, word).tables.filter((t) => t.pos === 'adverb');
}

const forms = (word: string) =>
  Object.fromEntries(adverbs(word)[0]!.inflections.map((i) => [i.tags[0], i.forms]));

describe('Danish adverbs', () => {
  it('reads irregular comparison from the headword (gerne: hellere, helst)', () => {
    expect(forms('gerne')).toEqual({ positive: ['gerne'], comparative: ['hellere'], superlative: ['helst'] });
  });

  it('reads regular comparison (ofte: oftere, oftest)', () => {
    expect(forms('ofte')).toEqual({ positive: ['ofte'], comparative: ['oftere'], superlative: ['oftest'] });
  });

  it('gives nothing for adverbs without comparison (meget, hurtigt)', () => {
    expect(adverbs('meget')).toEqual([]);
    expect(adverbs('hurtigt')).toEqual([]);
  });
});

describe('Danish adverb lookup', () => {
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

  it('finds the adverb of a superlative (helst -> gerne)', async () => {
    const result = await lookup(danish, 'helst');
    expect(result.status === 'ok' && result.entry.title).toBe('gerne');
  });

  it('finds both words a comparative belongs to (mindre -> lille, lidt)', async () => {
    const result = await lookup(danish, 'mindre');
    expect(result.status === 'ok' && result.match?.entries.map((e) => e.title)).toEqual(['lille', 'lidt']);
  });

  it('cannot find gerne from hellere: Wiktionary does not link them', async () => {
    const result = await lookup(danish, 'hellere');
    expect(result.status).toBe('no-inflection');
  });
});
