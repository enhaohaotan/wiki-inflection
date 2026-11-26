import type { PracticeLanguage } from './types';

type Upcoming = Pick<PracticeLanguage, 'code' | 'name' | 'ownName' | 'placeholder' | 'flag'>;

/**
 * A language listed in the picker before it can be practised: no verbs, no
 * tables, and the page stays empty. Replace it with a folder like ./fr once
 * there is a list of verbs and a way to turn its tables into exercises.
 */
function upcoming(language: Upcoming): PracticeLanguage {
  return {
    ...language,
    locale: language.code,
    verbs: [],
    keyVerbs: [],
    savedTable: () => undefined,
    // Never called: the page looks nothing up for a language without verbs.
    lookup: async (verb) => ({ status: 'not-found', query: verb }),
    buildSheet: (table) => ({ lemma: table.lemma, pos: '', sections: [] }),
    sourcePage: (table) => table.lemma,
    kindOf: () => 'regular',
    isComplete: () => true,
    spellingHint: '',
  };
}

export const germanPractice = upcoming({
  code: 'de',
  name: 'German',
  ownName: 'Deutsch',
  placeholder: 'Verb',
  flag: ['#000000', '#dd0000', '#ffce00'],
});

export const spanishPractice = upcoming({
  code: 'es',
  name: 'Spanish',
  ownName: 'Español',
  placeholder: 'verbo',
  // The middle band is twice as wide: red, yellow, yellow, red.
  flag: ['#aa151b', '#f1bf00', '#f1bf00', '#aa151b'],
});

export const italianPractice = upcoming({
  code: 'it',
  name: 'Italian',
  ownName: 'Italiano',
  placeholder: 'verbo',
  flag: ['#009246', '#ffffff', '#ce2b37'],
});
