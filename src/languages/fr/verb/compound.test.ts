import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../../core/types';
import { findLanguageSection, parsePage } from '../../../wiktionary/page';
import { french } from '..';
import { auxiliariesInRule } from './auxiliaries';
import { agreementNotation, layoutConjugation, type Conjugation } from './viewLayout';
import { parseParticipleForms } from './participle';

function section(fixture: string): Element {
  const html = readFileSync(resolve(process.cwd(), 'test/fixtures', `${fixture}.html`), 'utf8');
  const found = findLanguageSection(parsePage(html), 'French');
  if (!found) throw new Error(`no French section in ${fixture}`);
  return found;
}

/** Runs parse + enrich, serving participle pages from fixtures named "pp-<participle>". */
async function load(
  verb: string,
  page = verb,
): Promise<{ tables: InflectionTable[]; fetched: string[] }> {
  const fetched: string[] = [];
  const entry = await french.enrich!(french.parse(section(page), verb), async (title) => {
    fetched.push(title);
    try {
      return section(`pp-${title}`);
    } catch {
      return null;
    }
  }, async () => null);
  return { tables: entry.tables, fetched };
}

function tense(c: Conjugation, moodId: string, name: string): string[] {
  const t = c.moods.find((m) => m.id === moodId)?.pairs.find((p) => p.compound?.fr === name)?.compound;
  if (!t) throw new Error(`no ${moodId} ${name}`);
  return t.rows.map((r) => (r.forms.length ? `${r.pronoun} ${r.forms.join(' / ')}` : `${r.pronoun} —`));
}

describe('parseParticipleForms', () => {
  it('reads the agreed forms from the Participle entry', () => {
    expect(parseParticipleForms(section('pp-allé')).map((i) => `${i.tags.join('|')}=${i.forms}`)).toEqual([
      'pp|f|s=allée',
      'pp|m|p=allés',
      'pp|f|p=allées',
    ]);
  });

  it('prefers the Participle entry over an Adjective one and finds it under an etymology', () => {
    expect(parseParticipleForms(section('pp-mort')).map((i) => i.forms[0])).toEqual(['morte', 'morts', 'mortes']);
    expect(parseParticipleForms(section('pp-dissous')).map((i) => i.forms[0])).toEqual([
      'dissoute',
      'dissous',
      'dissoutes',
    ]);
  });
});

describe('auxiliariesInRule', () => {
  it('reads one or two auxiliaries, and pronominal s’être', () => {
    expect(auxiliariesInRule('present indicative of être + past participle')).toEqual([
      { auxiliary: 'être', reflexive: false, en: false },
    ]);
    expect(auxiliariesInRule('present indicative of avoir or être + past participle')).toEqual([
      { auxiliary: 'avoir', reflexive: false, en: false },
      { auxiliary: 'être', reflexive: false, en: false },
    ]);
    expect(auxiliariesInRule("present indicative of s'être + past participle")).toEqual([
      { auxiliary: 'être', reflexive: true, en: false },
    ]);
  });
});

describe('agreementNotation', () => {
  const allé = { ms: 'allé', fs: 'allée', mp: 'allés', fp: 'allées' };
  const assis = { ms: 'assis', fs: 'assise', mp: 'assis', fp: 'assises' };
  const dissous = { ms: 'dissous', fs: 'dissoute', mp: 'dissous', fp: 'dissoutes' };

  it('writes the usual textbook notation', () => {
    expect(agreementNotation('1', 's', allé)).toBe('allé(e)');
    expect(agreementNotation('1', 'p', allé)).toBe('allé(e)s');
    expect(agreementNotation('2', 'p', allé)).toBe('allé(e)(s)');
  });

  it('handles participles ending in s', () => {
    expect(agreementNotation('1', 's', assis)).toBe('assis(e)');
    expect(agreementNotation('3', 'p', assis)).toBe('assis(es)');
    expect(agreementNotation('2', 'p', assis)).toBe('assis(e)(s)');
  });

  it('lists forms that do not share a stem', () => {
    expect(agreementNotation('1', 's', dissous)).toBe('dissous / dissoute');
  });

  it('falls back to the masculine form without agreement data', () => {
    expect(agreementNotation('1', 'p', { ms: 'allé' })).toBe('allé');
  });
});

describe('compound tenses', () => {
  it('builds être tenses with agreement (aller)', async () => {
    const { tables, fetched } = await load('aller');
    expect(fetched).toEqual(['allé']);
    const c = layoutConjugation(tables[0]!);
    expect(tense(c, 'indicatif', 'Passé composé')).toEqual([
      'je suis allé(e)',
      'tu es allé(e)',
      'il/elle/on est allé(e)',
      'nous sommes allé(e)s',
      'vous êtes allé(e)(s)',
      'ils/elles sont allé(e)s',
    ]);
    expect(tense(c, 'indicatif', 'Plus-que-parfait')[0]).toBe('j’ étais allé(e)');
    expect(tense(c, 'conditionnel', 'Passé')[0]).toBe('je serais allé(e)');
    expect(tense(c, 'subjonctif', 'Passé')[2]).toBe('qu’il/elle/on soit allé(e)');
    expect(tense(c, 'imperatif', 'Passé')).toEqual([
      '(tu) sois allé(e)',
      '(nous) soyons allé(e)s',
      '(vous) soyez allé(e)(s)',
    ]);
  });

  it('builds avoir tenses without agreement and without fetching (manger)', async () => {
    const { tables, fetched } = await load('manger');
    expect(fetched).toEqual([]);
    const c = layoutConjugation(tables[0]!);
    expect(tense(c, 'indicatif', 'Passé composé')).toEqual([
      'j’ ai mangé',
      'tu as mangé',
      'il/elle/on a mangé',
      'nous avons mangé',
      'vous avez mangé',
      'ils/elles ont mangé',
    ]);
    expect(tense(c, 'subjonctif', 'Plus-que-parfait')[0]).toBe('que j’ eusse mangé');
    expect(tense(c, 'imperatif', 'Passé')[0]).toBe('(tu) aie mangé');
  });

  it('lists both auxiliaries when a verb takes either (passer)', async () => {
    const { tables } = await load('passer');
    const c = layoutConjugation(tables[0]!);
    expect(tense(c, 'indicatif', 'Passé composé')[0]).toBe('j’ / je ai passé / suis passé(e)');
    expect(tense(c, 'indicatif', 'Passé composé')[3]).toBe('nous avons passé / sommes passé(e)s');
  });

  it('adds the reflexive pronoun and drops the compound imperative (s’asseoir)', async () => {
    const { tables, fetched } = await load("s'asseoir", 'asseoir');
    expect(fetched).toEqual(['assis']);
    const c = layoutConjugation(tables[0]!);
    expect(tense(c, 'indicatif', 'Passé composé')).toEqual([
      'je me suis assis(e)',
      "tu t'es assis(e)",
      "il/elle/on s'est assis(e)",
      'nous nous sommes assis(es)',
      'vous vous êtes assis(e)(s)',
      'ils/elles se sont assis(es)',
    ]);
    expect(tense(c, 'indicatif', 'Plus-que-parfait')[0]).toBe("je m'étais assis(e)");
    expect(c.moods.find((m) => m.id === 'imperatif')!.pairs.some((p) => p.compound)).toBe(false);
    // The non-pronominal table on the same page uses avoir.
    expect(tense(layoutConjugation(tables[1]!), 'indicatif', 'Passé composé')[0]).toBe('j’ ai assis');
  });

  it('puts "en" after the reflexive pronoun (s’en être)', async () => {
    const { tables } = await load('être');
    const sEnEtre = tables.find((t) => t.lemma === "s'en être")!;
    expect(auxiliariesInRule(sEnEtre.periphrastic[2]!.rule)).toEqual([{ auxiliary: 'être', reflexive: true, en: true }]);
    const c = layoutConjugation(sEnEtre);
    expect(tense(c, 'indicatif', 'Passé composé')).toEqual([
      "je m'en suis été",
      "tu t'en es été",
      "il/elle/on s'en est été",
      'nous nous en sommes été',
      'vous vous en êtes été',
      'ils/elles s’en sont été'.replace('’', "'"),
    ]);
  });

  it('only gives compound forms for persons the verb has (pleuvoir)', async () => {
    const { tables } = await load('pleuvoir');
    const c = layoutConjugation(tables[0]!);
    expect(tense(c, 'indicatif', 'Passé composé')).toEqual([
      'je —',
      'tu —',
      'il/elle/on a plu',
      'nous —',
      'vous —',
      'ils/elles ont plu',
    ]);
  });

  it('uses an irregular feminine from the participle page (mourir)', async () => {
    const { tables } = await load('mourir');
    const c = layoutConjugation(tables[0]!);
    expect(tense(c, 'indicatif', 'Passé composé')[0]).toBe('je suis mort(e)');
  });
});
