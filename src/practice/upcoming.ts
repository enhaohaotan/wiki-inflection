import * as de from './de/verbs';
import * as es from './es/verbs';
import * as it from './it/verbs';
import type { PracticeLanguage } from './types';

type Upcoming = Pick<PracticeLanguage, 'code' | 'name' | 'ownName' | 'placeholder' | 'flag'> & {
  verbs: { PRACTICE_VERBS: readonly string[]; KEY_VERBS: readonly string[] };
};

/**
 * A language listed before it can be practised: its home page shows its
 * verb list, but there are no tables yet and its other pages stay empty.
 * Replace it with a full PracticeLanguage, like ./fr, once its Wiktionary
 * conjugation tables can be parsed and turned into exercises.
 */
function upcoming({ verbs, ...language }: Upcoming): PracticeLanguage {
  return {
    ...language,
    locale: language.code,
    ready: false,
    verbs: verbs.PRACTICE_VERBS,
    keyVerbs: verbs.KEY_VERBS,
    savedTable: () => undefined,
    // Never called: the page looks nothing up for a language not ready yet.
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
  verbs: de,
  name: 'German',
  ownName: 'Deutsch',
  placeholder: 'Verb',
  flag: ['#000000', '#dd0000', '#ffce00'],
});

export const spanishPractice = upcoming({
  code: 'es',
  verbs: es,
  name: 'Spanish',
  ownName: 'Español',
  placeholder: 'verbo',
  // The middle band is twice as wide: red, yellow, yellow, red.
  flag: ['#aa151b', '#f1bf00', '#f1bf00', '#aa151b'],
});

export const italianPractice = upcoming({
  code: 'it',
  verbs: it,
  name: 'Italian',
  ownName: 'Italiano',
  placeholder: 'verbo',
  flag: ['#009246', '#ffffff', '#ce2b37'],
});
