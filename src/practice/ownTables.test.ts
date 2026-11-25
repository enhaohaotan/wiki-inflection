import { describe, expect, it } from 'vitest';
import { AUXILIARY_FORMS, type AuxTense } from '../languages/fr/verb/auxiliaries';
import { ownSheet } from './ownTables';
import { isCorrect, type Sheet } from './sheet';

const PERSONS = ['1s', '2s', '3s', '1p', '2p', '3p'];
const IMPERATIVE = ['2s', '1p', '2p'];

/** The tense each simple tense's auxiliary is put in, by mood and tense name. */
const AUX_TENSES: [string, string, AuxTense][] = [
  ['indicatif', 'Présent', 'pres|indc'],
  ['indicatif', 'Imparfait', 'impf|indc'],
  ['indicatif', 'Passé simple', 'phis'],
  ['indicatif', 'Futur simple', 'futr'],
  ['conditionnel', 'Présent', 'cond'],
  ['subjonctif', 'Présent', 'pres|subj'],
  ['subjonctif', 'Imparfait', 'impf|subj'],
];

const agree = (p: string) => (p.endsWith('s') ? 'aimé(e)' : 'aimé(e)s');

/** Forms of the simple tense `simple` and of the compound tense beside it. */
function pair(sheet: Sheet, mood: string, simple: string): [string[], string[]] {
  const found = sheet.sections.find((s) => s.id === mood)?.pairs.find((p) => p[0]!.fr === simple);
  if (!found) throw new Error(`no ${mood} ${simple}`);
  const forms = (i: number) => found[i]?.blanks.map((b) => b.forms[0]!) ?? [];
  return [forms(0), forms(1)];
}

describe('être aimé', () => {
  const sheet = ownSheet('être aimé')!;

  it('is être + aimé(e)(s), and avoir été + aimé(e)(s) in the compound tenses', () => {
    for (const [mood, tense, aux] of AUX_TENSES) {
      const [simple, compound] = pair(sheet, mood, tense);
      expect(simple, `${mood} ${tense}`).toEqual(PERSONS.map((p) => `${AUXILIARY_FORMS.être[aux][p]} ${agree(p)}`));
      expect(compound, `${mood} ${tense}`).toEqual(
        PERSONS.map((p) => `${AUXILIARY_FORMS.avoir[aux][p]} été ${agree(p)}`),
      );
    }
    const [imperative] = pair(sheet, 'imperatif', 'Présent');
    expect(imperative).toEqual(IMPERATIVE.map((p) => `${AUXILIARY_FORMS.être.impr[p]} ${agree(p)}`));
  });

  it('elides the pronoun before a vowel', () => {
    const labels = (mood: string, tense: string, i: number) =>
      sheet.sections.find((s) => s.id === mood)!.pairs.find((p) => p[0]!.fr === tense)![i]!.blanks.map((b) => b.label);
    expect(labels('indicatif', 'Présent', 0)[0]).toBe('je');
    expect(labels('indicatif', 'Présent', 1)[0]).toBe('j’');
    expect(labels('indicatif', 'Imparfait', 0)[0]).toBe('j’');
    expect(labels('subjonctif', 'Présent', 1)[0]).toBe('que j’');
    expect(labels('subjonctif', 'Présent', 1)[2]).toBe('qu’il/elle/on');
  });
});

describe("s'aimer", () => {
  const sheet = ownSheet("s'aimer")!;
  const REFLEXIVE: Record<string, string> = { '1s': 'me', '2s': 'te', '3s': 'se', '1p': 'nous', '2p': 'vous', '3p': 'se' };

  it('builds its compound tenses with the reflexive pronoun and être', () => {
    for (const [mood, tense, aux] of AUX_TENSES) {
      const [, compound] = pair(sheet, mood, tense);
      const expected = PERSONS.map((p) => {
        const verb = AUXILIARY_FORMS.être[aux][p]!;
        const reflexive = REFLEXIVE[p]!;
        const clitic = /^[mts]e$/.test(reflexive) && /^[aeéêiou]/.test(verb) ? `${reflexive[0]}'${verb}` : `${reflexive} ${verb}`;
        return `${clitic} ${agree(p)}`;
      });
      expect(compound, `${mood} ${tense}`).toEqual(expected);
    }
  });

  it('starts every simple form with its reflexive pronoun', () => {
    for (const [mood, tense] of AUX_TENSES) {
      const [simple] = pair(sheet, mood, tense);
      expect(simple.map((f) => f.split(/(?<=')| /)[0]), `${mood} ${tense}`).toEqual(["m'", "t'", "s'", 'nous', 'vous', "s'"]);
    }
  });

  it('has no compound imperative', () => {
    expect(pair(sheet, 'imperatif', 'Présent')[1]).toEqual([]);
  });

  it('is found however it is typed, and accepts the agreed forms', () => {
    expect(ownSheet('S’aimer')?.lemma).toBe("s'aimer");
    expect(ownSheet('aimer')).toBeUndefined();
    const blank = sheet.sections[0]!.pairs[0]![1]!.blanks[0]!;
    expect(isCorrect('me suis aimée', blank)).toBe(true);
    expect(isCorrect('m’ai aimé', blank)).toBe(false);
  });
});
