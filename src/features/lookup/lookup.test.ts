import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { french } from '../../languages/fr';
import { matchesForm } from '../../languages/fr/verb/layout';
import { findLanguageSection, formOfTargets, parsePage } from '../../wiktionary/page';
import { lookup } from './lookup';

const FIXTURES = resolve(process.cwd(), 'test/fixtures');

/** Fixture for a page title: lemma pages are "<title>.html", forms "form-<title>.html", participles "pp-<title>.html". */
function fixtureFor(title: string): string | null {
  for (const name of [title, `form-${title}`, `pp-${title}`]) {
    const path = resolve(FIXTURES, `${name}.html`);
    if (existsSync(path)) return readFileSync(path, 'utf8');
  }
  return null;
}

function frenchSection(name: string): Element {
  const section = findLanguageSection(parsePage(fixtureFor(name)!), 'French');
  if (!section) throw new Error(`no French section in ${name}`);
  return section;
}

describe('formOfTargets', () => {
  it('finds the verbs an inflected form belongs to', () => {
    const verbs = (h: string) => /^(Verb|Participle)\b/.test(h);
    expect(formOfTargets(frenchSection('vais'), 'fr', verbs)).toEqual(['aller', 'vader']);
    expect(formOfTargets(frenchSection('suis'), 'fr', verbs)).toEqual(['être', 'suivre']);
    expect(formOfTargets(frenchSection('allais'), 'fr', verbs)).toEqual(['aller']);
    expect(formOfTargets(frenchSection('allée'), 'fr', verbs)).toEqual(['allé']);
  });

  it('ignores non-verb senses (est is also a noun)', () => {
    expect(french.lemmasOf!(frenchSection('est'), 'est')).toEqual(['être']);
  });
});

describe('matchesForm', () => {
  it('matches exact forms and pronominal forms without their pronoun', () => {
    expect(matchesForm('vais', 'vais')).toBe(true);
    expect(matchesForm('vais', 'Vais')).toBe(true);
    expect(matchesForm("m'assois", 'assois')).toBe(true);
    expect(matchesForm('nous assoyons', 'assoyons')).toBe(true);
    expect(matchesForm('assieds-toi', 'assieds')).toBe(true);
    expect(matchesForm('vas', 'vais')).toBe(false);
  });
});

describe('lookup (reverse)', () => {
  const requested: string[] = [];

  beforeEach(() => {
    localStorage.clear();
    requested.length = 0;
    vi.stubGlobal('fetch', async (url: string) => {
      const title = decodeURIComponent(url.match(/\/page\/([^/]+)\/html/)![1]!).replace(/_/g, ' ');
      requested.push(title);
      const html = fixtureFor(title);
      return html ? new Response(html, { status: 200 }) : new Response('', { status: 404 });
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('shows the verb an inflected form belongs to', async () => {
    const result = await lookup(french, 'vais');
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.entry.title).toBe('aller');
    expect(result.match).toEqual({ form: 'vais', lemmas: ['aller', 'vader'], lemma: 'aller' });
    // aller takes être, so its participle page is fetched for agreement
    expect(requested).toEqual(['vais', 'aller', 'allé']);
  });

  it('lets the caller pick among several verbs', async () => {
    const first = await lookup(french, 'suis');
    expect(first.status === 'ok' && first.entry.title).toBe('être');
    const chosen = await lookup(french, 'suis', undefined, 'suivre');
    expect(chosen.status === 'ok' && chosen.entry.title).toBe('suivre');
    expect(chosen.status === 'ok' && chosen.match?.lemma).toBe('suivre');
  });

  it('follows two links: allée -> allé -> aller', async () => {
    const result = await lookup(french, 'allée');
    expect(result.status === 'ok' && result.entry.title).toBe('aller');
  });

  it('uses the cache the second time', async () => {
    await lookup(french, 'vais');
    requested.length = 0;
    const again = await lookup(french, 'vais');
    expect(again.status === 'ok' && again.match?.lemma).toBe('aller');
    expect(requested).toEqual([]);
  });

  it('still looks up dictionary forms directly', async () => {
    const result = await lookup(french, 'manger');
    expect(result.status === 'ok' && result.match).toBeUndefined();
  });
});
