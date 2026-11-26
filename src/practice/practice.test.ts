import { describe, expect, it } from 'vitest';
import { normalizeAnswer } from './answers';
import { defaultPracticeLanguage, getPracticeLanguage, PRACTICE_LANGUAGES } from './languages';
import { randomVerb } from './random';
import { storeTable } from './saved';
import { homeHref, parseHash, verbHref } from './route';

const fr = getPracticeLanguage('fr')!;

describe('parseHash', () => {
  it('reads the language and the verb', () => {
    expect(parseHash('#/fr/aller')).toEqual({ language: fr, word: 'aller' });
    expect(parseHash('#/fr/se%20lever')).toEqual({ language: fr, word: 'se lever' });
    expect(parseHash('#/fr')).toEqual({ language: fr, word: '' });
  });

  it('opens the home page of the default language when there is nothing', () => {
    expect(parseHash('')).toEqual({ language: defaultPracticeLanguage, word: '' });
    expect(parseHash('#')).toEqual({ language: defaultPracticeLanguage, word: '' });
  });

  it('opens the default home page for anything without a known language', () => {
    expect(parseHash('#aller')).toEqual({ language: defaultPracticeLanguage, word: '' });
    expect(parseHash('#/aller')).toEqual({ language: defaultPracticeLanguage, word: '' });
    expect(parseHash('#/xx/aller')).toEqual({ language: defaultPracticeLanguage, word: '' });
  });

  it('reads back what it writes', () => {
    expect(parseHash(verbHref(fr, 'être aimé'))).toEqual({ language: fr, word: 'être aimé' });
    expect(parseHash(homeHref(fr))).toEqual({ language: fr, word: '' });
  });
});

describe('every practice language', () => {
  it('has a code of its own', () => {
    const codes = PRACTICE_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  for (const language of PRACTICE_LANGUAGES) {
    describe(language.name, () => {
      it('lists each verb once, the key verbs among them', () => {
        expect(new Set(language.verbs).size).toBe(language.verbs.length);
        expect(language.keyVerbs.filter((v) => !language.verbs.includes(v))).toEqual([]);
      });

      it.skipIf(!language.ready)('has a saved, complete table for every verb on its list', () => {
        const missing = language.verbs.filter((v) => !language.savedTable(v));
        expect(missing).toEqual([]);
        const incomplete = language.verbs.filter((v) => {
          const table = language.savedTable(v);
          return table && !language.isComplete(storeTable(table));
        });
        expect(incomplete).toEqual([]);
      });

      it('can always pick a different verb at random', () => {
        const [first] = language.verbs;
        expect(randomVerb(language.verbs, first, () => 0.5)).not.toBe(first);
      });
    });
  }
});

describe('normalizeAnswer', () => {
  it('ignores case, spacing and the kind of apostrophe, but not accents', () => {
    expect(normalizeAnswer('  M’Appelle ', 'fr')).toBe("m'appelle");
    expect(normalizeAnswer('allé', 'fr')).not.toBe(normalizeAnswer('alle', 'fr'));
  });
});
