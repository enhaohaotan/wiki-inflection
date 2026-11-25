import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { lookup } from '../../../features/lookup/lookup';
import { danish } from '..';
import { danishMainTables } from '../verb/layout';
import { layoutDanishNoun } from './layout';

const DIR = resolve(process.cwd(), 'test/fixtures/da');

function section(name: string): Element {
  const found = findLanguageSection(parsePage(readFileSync(resolve(DIR, `${name}.html`), 'utf8')), 'Danish');
  if (!found) throw new Error(`no Danish section in ${name}`);
  return found;
}

const entry = (word: string) => danish.parse(section(word), word);
const nouns = (word: string) => entry(word).tables.filter((t) => t.pos === 'noun');

describe('Danish nouns', () => {
  it('reads gender, definiteness and number (hus, neuter)', () => {
    expect(layoutDanishNoun(nouns('hus')[0]!)).toEqual({
      lemma: 'hus',
      article: 'et',
      rows: [
        { label: 'Ental', indefinite: ['hus'], definite: ['huset'] },
        { label: 'Flertal', indefinite: ['huse'], definite: ['husene'] },
      ],
    });
  });

  it('uses en for common gender and keeps irregular plurals (mand)', () => {
    const n = layoutDanishNoun(nouns('mand')[0]!);
    expect(n.article).toBe('en');
    expect(n.rows[1]!.indefinite).toEqual(['mænd']);
  });

  it('has no plural row for uncountable nouns (kaffe)', () => {
    const n = layoutDanishNoun(nouns('kaffe')[0]!);
    expect(n.rows).toEqual([{ label: 'Ental', indefinite: ['kaffe'], definite: ['kaffen'] }]);
  });

  it('keeps every declension on the page (øje has two plurals)', () => {
    expect(nouns('øje').map((t) => layoutDanishNoun(t).rows[1]!.indefinite)).toEqual([['øjne'], ['øjer']]);
  });

  it('keeps nouns and verbs in page order (spise)', () => {
    expect(entry('spise').tables.map((t) => t.pos)).toEqual(['noun', 'verb']);
  });

  it('shows both the noun and the verb when a form belongs to both (spiser)', () => {
    expect(danishMainTables(entry('spise'), 'spiser').map((t) => t.pos)).toEqual(['noun', 'verb']);
    expect(danishMainTables(entry('spise'), 'spist').map((t) => t.pos)).toEqual(['verb']);
  });
});

describe('Danish noun lookup', () => {
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

  it('finds the noun of a plural form (mænd -> mand)', async () => {
    const result = await lookup(danish, 'mænd');
    expect(result.status === 'ok' && result.entry.title).toBe('mand');
  });

  it('finds the noun of a definite form (biler -> bil)', async () => {
    const result = await lookup(danish, 'biler');
    expect(result.status === 'ok' && result.entry.title).toBe('bil');
  });
});
