import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../../core/types';
import type { ConjugationLayout, ConjugationMood, ConjugationRow } from '../../conjugation';
import { fixtureEntry, fixtureLoader, fixtureSection, tenseIn } from '../../testing';
import { french } from '..';
import { auxiliariesInRule } from './auxiliaries';
import { agreementNotation, conjugationLayout, pronounFor } from './layout';

const load = fixtureLoader(french);
const tensesOf = (mood: ConjugationMood) => mood.pairs.flat();

/** A verb's layout with the agreed participle forms from its participle's page. */
async function layoutOf(verb: string): Promise<ConjugationLayout> {
  return conjugationLayout((await fixtureEntry(french, verb)).tables[0]!);
}

/** Parse + enrich, noting which participle pages were asked for. */
async function loadWithFetches(verb: string, page = verb): Promise<{ tables: InflectionTable[]; fetched: string[] }> {
  const fetched: string[] = [];
  const entry = await french.enrich!(
    french.parse(fixtureSection(french, page)!, verb),
    async (title) => {
      fetched.push(title);
      return fixtureSection(french, `pp-${title}`);
    },
    async () => null,
  );
  return { tables: entry.tables, fetched };
}

/** A compound tense's rows as text: "je suis allé(e)", "je —". */
function tense(c: ConjugationLayout, moodId: string, name: string): string[] {
  const t = c.moods
    .find((m) => m.id === moodId)
    ?.pairs.flat()
    .find((tense) => tense.compound && tense.name === name);
  if (!t) throw new Error(`no ${moodId} ${name}`);
  return t.rows.map((r) => (r.shown.length ? `${r.label} ${r.shown.join(' / ')}` : `${r.label} —`));
}

function row(c: ConjugationLayout, mood: string, name: string, index: number): ConjugationRow {
  return tenseIn(c, mood, name)[index]!;
}

describe('conjugationLayout', () => {
  it('groups aller into moods and tenses with pronouns', () => {
    const c = conjugationLayout(load('aller'));
    expect(c.moods.map((m) => m.name)).toEqual(['Indicatif', 'Conditionnel', 'Subjonctif', 'Impératif', 'Participe']);
    expect(tensesOf(c.moods[4]!)[0]!.rows.map((r) => [r.label, r.shown])).toEqual([
      ['présent', ['allant']],
      ['passé', ['allé']],
    ]);

    const present = tensesOf(c.moods[0]!)[0]!;
    expect(present.rows.map((r) => `${r.label} ${r.shown[0]}`)).toEqual([
      'je vais',
      'tu vas',
      'il/elle/on va',
      'nous allons',
      'vous allez',
      'ils/elles vont',
    ]);
    const subjunctive = tensesOf(c.moods[2]!)[0]!;
    expect(subjunctive.rows.map((r) => r.label)).toEqual([
      'que j’',
      'que tu',
      'qu’il/elle/on',
      'que nous',
      'que vous',
      'qu’ils/elles',
    ]);
    expect(tensesOf(c.moods[3]!)[0]!.rows.map((r) => `${r.label} ${r.shown[0]}`)).toEqual([
      '(tu) va',
      '(nous) allons',
      '(vous) allez',
    ]);
    expect(c.moods[0]!.pairs.map((p) => p.map((t) => t.name).join(' | '))).toEqual([
      'Présent | Passé composé',
      'Imparfait | Plus-que-parfait',
      'Passé simple | Passé antérieur',
      'Futur simple | Futur antérieur',
    ]);
    expect(c.moods[1]!.pairs.map((p) => p.map((t) => t.name).join(' | '))).toEqual(['Présent | Passé']);
    expect(c.moods[2]!.pairs.map((p) => p.map((t) => t.name).join(' | '))).toEqual([
      'Présent | Passé',
      'Imparfait | Plus-que-parfait',
    ]);
  });

  it('shows gaps for missing persons and drops empty moods (pleuvoir)', () => {
    const c = conjugationLayout(load('pleuvoir'));
    expect(c.moods.map((m) => m.id)).toEqual(['indicatif', 'conditionnel', 'subjonctif', 'participe']);
    const present = tensesOf(c.moods[0]!)[0]!;
    expect(present.rows.map((r) => r.shown.length)).toEqual([0, 0, 1, 0, 0, 1]);
  });

  it('elides je before a vowel', () => {
    expect(pronounFor('1', 's', 'plain', 'irai')).toBe('j’');
    expect(pronounFor('1', 's', 'plain', 'vais')).toBe('je');
    expect(pronounFor('1', 's', 'plain', 'habite')).toBe('je (j’)');
    expect(pronounFor('1', 's', 'subjunctive', 'aille')).toBe('que j’');
  });
});

describe('folding', () => {
  it('folds compound and literary tenses', () => {
    const folded = Object.fromEntries(
      conjugationLayout(load('aller')).moods.flatMap((mood) =>
        mood.pairs.flat().map((tense) => [`${mood.id}/${tense.name}`, tense.folded]),
      ),
    );
    expect(folded['indicatif/Présent']).toBe(false);
    expect(folded['indicatif/Passé composé']).toBe(true);
    expect(folded['indicatif/Passé simple']).toBe(true);
    expect(folded['subjonctif/Imparfait']).toBe(true);
    expect(folded['indicatif/Imparfait']).toBe(false);
    expect(folded['subjonctif/Présent']).toBe(false);
  });
});

describe('rows', () => {
  it('elides the subject pronoun before a vowel', async () => {
    const aller = await layoutOf('aller');
    expect(row(aller, 'indicatif', 'Imparfait', 0).label).toBe('j’');
    expect(row(aller, 'indicatif', 'Passé composé', 0).label).toBe('je');
    expect(row(aller, 'subjonctif', 'Présent', 0).label).toBe('que j’');
    expect(row(aller, 'indicatif', 'Futur simple', 0).label).toBe('j’');
    // two auxiliaries, two ways of writing the pronoun: j’ai passé / je suis passé(e)
    const passer = row(await layoutOf('passer'), 'indicatif', 'Passé composé', 0);
    expect(passer.label).toBe('j’ / je');
    expect(passer.subjects).toEqual(['j’', 'je']);
  });

  it('has a row per person', async () => {
    const aller = await layoutOf('aller');
    expect(aller.lemma).toBe('aller');
    expect(aller.moods.map((m) => m.id)).toEqual(['indicatif', 'conditionnel', 'subjonctif', 'imperatif', 'participe']);
    expect(tenseIn(aller, 'indicatif', 'Présent').map((r) => r.label)).toEqual([
      'je',
      'tu',
      'il/elle/on',
      'nous',
      'vous',
      'ils/elles',
    ]);
    expect(row(aller, 'subjonctif', 'Présent', 2).label).toBe('qu’il/elle/on');
    expect(row(aller, 'imperatif', 'Présent', 0).label).toBe('(tu)');
  });

  it('accepts every agreed form of a compound tense with être', async () => {
    const pc = row(await layoutOf('aller'), 'indicatif', 'Passé composé', 0);
    expect(pc.shown).toEqual(['suis allé(e)']);
    expect(pc.accepted).toEqual(['suis allé', 'suis allée']);
  });

  it('accepts the agreed past participles', async () => {
    const pp = row(await layoutOf('aller'), 'participe', 'Participe', 1);
    expect(pp.label).toBe('passé');
    expect(pp.accepted).toContain('allées');
  });

  it('accepts either auxiliary when both are used', async () => {
    const pc = row(await layoutOf('passer'), 'indicatif', 'Passé composé', 0);
    expect(pc.accepted).toEqual(expect.arrayContaining(['ai passé', 'suis passée']));
  });

  it('writes the pronoun into a pronominal table’s forms (s’asseoir)', () => {
    const c = conjugationLayout(load('asseoir', "s'asseoir"));
    expect(tensesOf(c.moods[0]!)[0]!.rows[0]).toMatchObject({ label: 'je', shown: ["m'assois", "m'assieds"] });
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
    const { tables, fetched } = await loadWithFetches('aller');
    expect(fetched).toEqual(['allé']);
    const c = conjugationLayout(tables[0]!);
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
    const { tables, fetched } = await loadWithFetches('manger');
    expect(fetched).toEqual([]);
    const c = conjugationLayout(tables[0]!);
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
    const { tables } = await loadWithFetches('passer');
    const c = conjugationLayout(tables[0]!);
    expect(tense(c, 'indicatif', 'Passé composé')[0]).toBe('j’ / je ai passé / suis passé(e)');
    expect(tense(c, 'indicatif', 'Passé composé')[3]).toBe('nous avons passé / sommes passé(e)s');
  });

  it('adds the reflexive pronoun and drops the compound imperative (s’asseoir)', async () => {
    const { tables, fetched } = await loadWithFetches("s'asseoir", 'asseoir');
    expect(fetched).toEqual(['assis']);
    const c = conjugationLayout(tables[0]!);
    expect(tense(c, 'indicatif', 'Passé composé')).toEqual([
      'je me suis assis(e)',
      "tu t'es assis(e)",
      "il/elle/on s'est assis(e)",
      'nous nous sommes assis(es)',
      'vous vous êtes assis(e)(s)',
      'ils/elles se sont assis(es)',
    ]);
    expect(tense(c, 'indicatif', 'Plus-que-parfait')[0]).toBe("je m'étais assis(e)");
    expect(c.moods.find((m) => m.id === 'imperatif')!.pairs.flat().some((t) => t.compound)).toBe(false);
    // The non-pronominal table on the same page uses avoir.
    expect(tense(conjugationLayout(tables[1]!), 'indicatif', 'Passé composé')[0]).toBe('j’ ai assis');
  });

  it('puts "en" after the reflexive pronoun (s’en être)', async () => {
    const { tables } = await loadWithFetches('être');
    const sEnEtre = tables.find((t) => t.lemma === "s'en être")!;
    expect(auxiliariesInRule(sEnEtre.periphrastic[2]!.rule)).toEqual([{ auxiliary: 'être', reflexive: true, en: true }]);
    const c = conjugationLayout(sEnEtre);
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
    const { tables } = await loadWithFetches('pleuvoir');
    const c = conjugationLayout(tables[0]!);
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
    const { tables } = await loadWithFetches('mourir');
    const c = conjugationLayout(tables[0]!);
    expect(tense(c, 'indicatif', 'Passé composé')[0]).toBe('je suis mort(e)');
  });
});
