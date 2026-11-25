import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from '../../../features/lookup/lookup';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { danish } from '..';
import {
  danishNumberValue,
  danishNumberWord,
  numeralRow,
  parseNumberBox,
  parseNumeralAppendix,
  shortFirst,
  standardFirst,
  type NumeralGroup,
} from './parse';

const DIR = resolve(process.cwd(), 'test/fixtures/da');
const read = (name: string) => readFileSync(resolve(DIR, `${name}.html`), 'utf8');
const section = (name: string) => findLanguageSection(parsePage(read(name)), 'Danish')!;

describe('Danish numeral box', () => {
  it('reads value, cardinal and ordinal (femogtyve)', () => {
    expect(parseNumberBox(section('femogtyve'))).toEqual({
      value: '25',
      cardinal: ['femogtyve'],
      ordinal: ['femogtyvende'],
    });
  });

  it('keeps both genders of one (en, et)', () => {
    expect(parseNumberBox(section('en'))).toEqual({ value: '1', cardinal: ['en', 'et'], ordinal: ['første'] });
  });

  it('is missing on some numeral pages (tusind)', () => {
    expect(parseNumberBox(section('tusind'))).toBeNull();
    // still a numeral (from its Numeral heading); tusind is also a noun
    expect(danish.parse(section('tusind'), 'tusind').tables.map((t) => t.pos)).toEqual(['numeral', 'noun']);
  });
});

describe('Danish numerals appendix', () => {
  const groups = parseNumeralAppendix(parsePage(read('Appendix:Danish numerals')));
  const row = (value: string) => groups.flatMap((g) => g.rows).find((r) => r.value === value);

  it('groups 0–19, the tens and the large numbers', () => {
    expect(groups.map((g) => [g.title, g.rows[0]!.value, g.rows.at(-1)!.value])).toEqual([
      ['Små tal', '0', '19'],
      ['Tiere', '20', '100'],
      ['Store tal', '1000', '1000000000000000000'],
    ]);
  });

  it('leaves out rare forms set apart with a footnote (toti)', () => {
    expect(row('20')).toEqual({ value: '20', cardinal: ['tyve'], ordinal: ['tyvende'] });
    expect(row('50')!.cardinal).toEqual(['halvtreds']);
  });

  it('puts the standard long ordinal first, else keeps the order', () => {
    expect(standardFirst(['halvfjerdsende', 'halvfjerdsindstyvende'])).toEqual(['halvfjerdsindstyvende', 'halvfjerdsende']);
    expect(standardFirst(row('40')!.ordinal)).toEqual(['fyrretyvende', 'fyrrende']);
    expect(standardFirst(['ellevte', 'elvte'])).toEqual(['ellevte', 'elvte']);
    expect(shortFirst(['halvfjerdsindstyvende', 'halvfjerdsende'])).toEqual(['halvfjerdsende', 'halvfjerdsindstyvende']);
    expect(shortFirst(['tyvende'])).toEqual(['tyvende']);
    expect(shortFirst(['ellevte', 'elvte'])).toEqual(['ellevte', 'elvte']);
  });

  it('gives every numeral its forms by one rule', () => {
    // From the appendix, standard ordinal first
    expect(numeralRow('70', groups)).toEqual({
      value: '70',
      cardinal: ['halvfjerds'],
      ordinal: ['halvfjerdsindstyvende', 'halvfjerdsende'],
    });
    expect(numeralRow('1000', groups)?.cardinal).toEqual(['tusinde', 'tusind']);
    // 21–99: unit + og + tens, with each ordinal of the tens, standard first
    expect(numeralRow('88', groups)).toEqual({
      value: '88',
      cardinal: ['otteogfirs'],
      ordinal: ['otteogfirsindstyvende', 'otteogfirsende'],
    });
    expect(numeralRow('91', groups)?.ordinal).toEqual(['enoghalvfemsindstyvende', 'enoghalvfemsende']);
    expect(numeralRow('31', groups)?.cardinal).toEqual(['enogtredive', 'enogtredve']);
    expect(numeralRow('25', groups)).toEqual({ value: '25', cardinal: ['femogtyve'], ordinal: ['femogtyvende'] });
    expect(numeralRow('200', groups)).toBeNull();
  });

  it('keeps alternatives listed side by side', () => {
    expect(row('1000')!.cardinal).toEqual(['tusinde', 'tusind']);
    expect(row('30')!.cardinal).toEqual(['tredive', 'tredve']);
  });
});

describe('danishNumberWord', () => {
  it('spells 0–100 the Danish way', () => {
    expect(['0', '1', '7', '12', '20', '21', '25', '50', '77', '99', '100'].map(danishNumberWord)).toEqual([
      'nul',
      'en',
      'syv',
      'tolv',
      'tyve',
      'enogtyve',
      'femogtyve',
      'halvtreds',
      'syvoghalvfjerds',
      'nioghalvfems',
      'hundrede',
    ]);
  });

  it('reads such a word back as a number', () => {
    expect(['otteogfirs', 'Femogtyve', 'nul', 'hundrede', 'tusind'].map(danishNumberValue)).toEqual([
      '88',
      '25',
      '0',
      '100',
      null,
    ]);
  });

  it('leaves everything else alone', () => {
    expect(['101', '1000', '-1', '2.5', 'fem', ''].map(danishNumberWord)).toEqual([null, null, null, null, null, null]);
  });
});

describe('Danish numeral lookup', () => {
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

  const numeral = async (query: string) => {
    const result = await lookup(danish, query);
    if (result.status !== 'ok') throw new Error(result.status);
    const table = result.entry.tables.find((t) => t.pos === 'numeral')!;
    return {
      title: result.entry.title,
      forms: Object.fromEntries(table.inflections.map((i) => [i.tags[0], i.forms])),
      total: JSON.parse(table.meta.total ?? '[]') as NumeralGroup[],
    };
  };

  it('looks up a number typed as digits (25 -> femogtyve) with the table of all numerals', async () => {
    const n = await numeral('25');
    expect(n.title).toBe('femogtyve');
    expect(n.forms).toEqual({ value: ['25'], cardinal: ['femogtyve'], ordinal: ['femogtyvende'] });
    expect(n.total).toHaveLength(3);
  });

  it('takes the value from the word when the page has no box (otteogfirs)', async () => {
    const n = await numeral('88');
    expect(n.title).toBe('otteogfirs');
    // Wiktionary's page gives no ordinal for it: composed like enoghalvfemsindstyvende
    expect(n.forms).toEqual({ value: ['88'], cardinal: ['otteogfirs'], ordinal: ['otteogfirsindstyvende', 'otteogfirsende'] });
  });

  it('fills in the value from the appendix when the page has no box (tusind)', async () => {
    const n = await numeral('tusind');
    expect(n.forms).toEqual({ value: ['1000'], cardinal: ['tusinde', 'tusind'], ordinal: ['tusinde'] });
  });
});
