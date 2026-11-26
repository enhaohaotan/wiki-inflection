import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InflectionTable } from '../../core/types';
import { french } from '../../languages/fr';
import { findLanguageSection, parsePage } from '../../wiktionary/page';
import { practiceLookup } from './lookup';
import { pronominalTable } from './pronominal';
import { buildSheet } from './sheet';

const FIXTURES = resolve(process.cwd(), 'test/fixtures');

function section(name: string): Element | null {
  const path = resolve(FIXTURES, `${name}.html`);
  return existsSync(path) ? findLanguageSection(parsePage(readFileSync(path, 'utf8')), 'French') : null;
}

async function tables(verb: string): Promise<InflectionTable[]> {
  const entry = await french.enrich!(french.parse(section(verb)!, verb), async (t) => section(`pp-${t}`), async () => null);
  return entry.tables;
}

describe('pronominalTable', () => {
  it("builds s'asseoir from asseoir exactly as Wiktionary's own table has it", async () => {
    const [asseoir, sAsseoir] = await tables('asseoir');
    expect(sAsseoir!.lemma).toBe("s'asseoir");
    expect(buildSheet(pronominalTable(asseoir!, "s'asseoir"))).toEqual(buildSheet(sAsseoir!));
  });

  it('elides before a vowel or h, puts the pronoun after an imperative, and uses s’être', () => {
    const plain: InflectionTable = {
      lang: 'fr',
      pos: 'verb',
      lemma: 'habiller',
      title: 'Conjugation of habiller',
      notes: [],
      meta: { auxiliary: 'avoir' },
      inflections: [
        { tags: ['1', 's', 'pres', 'indc'], forms: ['habille'], ipa: [] },
        { tags: ['1', 'p', 'pres', 'indc'], forms: ['habillons'], ipa: [] },
        { tags: ['2', 's', 'impr'], forms: ['habille'], ipa: [] },
        { tags: ['ppr'], forms: ['habillant'], ipa: [] },
        { tags: ['pp'], forms: ['habillé'], ipa: [] },
      ],
      periphrastic: [
        { key: 'indicative:present perfect', label: '', rule: 'present indicative of avoir + past participle' },
      ],
    };
    const t = pronominalTable(plain, "s'habiller");
    expect(t.inflections.map((i) => i.forms[0])).toEqual([
      "m'habille",
      'nous habillons',
      'habille-toi',
      "s'habillant",
      'habillé',
      'habillée',
      'habillés',
      'habillées',
    ]);
    expect(t.periphrastic[0]!.rule).toBe("present indicative of s'être + past participle");
    const pc = buildSheet(t).sections[0]!.pairs[0]![1]!;
    expect(pc.name).toBe('Passé composé');
    expect(pc.blanks[0]!.forms).toEqual(["me suis habillé(e)"]);
  });
});

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
