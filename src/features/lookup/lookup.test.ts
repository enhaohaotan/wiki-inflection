import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { french } from '../../languages/fr';
import { mainTable, matchesForm, tablesWithMatch } from '../../languages/fr/verb/viewLayout';
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
    expect(matchesForm("m'en suis", 'suis')).toBe(true);
    expect(matchesForm('nous en sommes', 'sommes')).toBe(true);
    expect(matchesForm("va-t'en", 'va')).toBe(true);
    expect(matchesForm('vas', 'vais')).toBe(false);
  });
});

describe('tablesWithMatch', () => {
  it('marks every conjugation on the page that contains the form', () => {
    const tables = french.parse(frenchSection('être'), 'être').tables;
    expect(tables.map((t) => t.lemma)).toEqual(['être', "s'être", "s'en être"]);
    expect(tablesWithMatch(tables, 'suis')).toEqual([true, true, true]);
    expect(tablesWithMatch(tables, 'vais')).toEqual([false, false, false]);
    expect(tablesWithMatch(tables, undefined)).toEqual([false, false, false]);
  });
});

describe('mainTable', () => {
  it('stands for an entry by its plain verb when that has the form', () => {
    const etre = french.parse(frenchSection('être'), 'être');
    expect(mainTable(etre, 'suis')?.lemma).toBe('être');
  });

  it('falls back to a pronominal table when only that has the form', () => {
    const etre = french.parse(frenchSection('être'), 'être');
    expect(mainTable(etre, "m'en suis")?.lemma).toBe("s'en être");
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
    expect(result.match?.form).toBe('vais');
    // vader is also listed by Wiktionary but has no conjugation here, so it is left out
    expect(result.match?.entries.map((e) => e.title)).toEqual(['aller']);
    // aller takes être, so its participle page is fetched for agreement
    expect([...requested].sort()).toEqual(['aller', 'allé', 'vader', 'vais']);
  });

  it('loads every verb a form belongs to, and opens the preferred one', async () => {
    const first = await lookup(french, 'suis');
    expect(first.status === 'ok' && first.entry.title).toBe('être');
    expect(first.status === 'ok' && first.match?.entries.map((e) => e.title)).toEqual(['être', 'suivre']);
    const chosen = await lookup(french, 'suis', undefined, 'suivre');
    expect(chosen.status === 'ok' && chosen.entry.title).toBe('suivre');
    expect(chosen.status === 'ok' && chosen.match?.entries.map((e) => e.title)).toEqual(['être', 'suivre']);
  });

  it('follows two links: allée -> allé -> aller', async () => {
    const result = await lookup(french, 'allée');
    expect(result.status === 'ok' && result.entry.title).toBe('aller');
  });

  it('uses the cache the second time', async () => {
    await lookup(french, 'vais');
    requested.length = 0;
    const again = await lookup(french, 'vais');
    expect(again.status === 'ok' && again.entry.title).toBe('aller');
    expect(requested).toEqual([]);
  });

  it('still looks up dictionary forms directly', async () => {
    const result = await lookup(french, 'manger');
    expect(result.status === 'ok' && result.match).toBeUndefined();
  });
});
