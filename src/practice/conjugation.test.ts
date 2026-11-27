import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { practiceLookup } from './fr/lookup';

// The shared lookup, tried on French pages: reflexive verbs found on their
// own page, built from the plain verb, and plain verbs as they are.
const FIXTURES = resolve(process.cwd(), 'test/fixtures/fr');

describe('practiceLookup', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', async (url: string) => {
      const title = decodeURIComponent(url.match(/\/page\/([^/]+)\/html/)![1]!).replace(/_/g, ' ');
      const path = ['', 'form-', 'pp-'].map((p) => resolve(FIXTURES, `${p}${title}.html`)).find(existsSync);
      return path ? new Response(readFileSync(path, 'utf8')) : new Response('', { status: 404 });
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('builds a pronominal verb Wiktionary has no page for from its plain verb', async () => {
    const result = await practiceLookup('se passer');
    expect(result.status === 'ok' && result.table.lemma).toBe('se passer');
    expect(result.status === 'ok' && result.page).toBe('passer');
  });

  it("uses Wiktionary's own pronominal table when there is one", async () => {
    const result = await practiceLookup("s'asseoir");
    expect(result.status === 'ok' && result.table.lemma).toBe("s'asseoir");
  });

  it('leaves other verbs as they are', async () => {
    const result = await practiceLookup('aller');
    expect(result.status === 'ok' && result.table.lemma).toBe('aller');
  });
});
