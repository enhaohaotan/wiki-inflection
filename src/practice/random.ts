import type { PracticeLanguage, VerbKind } from './types';

/**
 * The Random button: picks a verb from a language's practice list, the
 * irregular ones more often, since a regular verb follows its group's
 * endings and practising one more teaches little.
 */

/** Relative chance of being picked. */
export const WEIGHTS: Record<VerbKind, number> = {
  /** parler, finir: the group's endings and nothing else. */
  regular: 1,
  /** manger (mangeons), appeler (appelle), préférer (préfère): regular endings, changing spelling. */
  spelling: 2,
  /** être, aller, prendre, venir... */
  irregular: 4,
};

/**
 * A verb from `verbs`, other than `current` so the button always changes the
 * page. `weight` sets how likely each verb is.
 */
export function randomVerb(
  verbs: readonly string[],
  current?: string,
  random: () => number = Math.random,
  weight: (verb: string) => number = () => 1,
): string {
  const choices = verbs.filter((v) => v !== current);
  const weights = choices.map(weight);
  let left = random() * weights.reduce((sum, w) => sum + w, 0);
  for (const [i, w] of weights.entries()) {
    left -= w;
    if (left < 0) return choices[i]!;
  }
  return choices[choices.length - 1]!;
}

/** The weight of each verb on a language's list, judged from its saved table once and remembered. */
export function verbWeights(language: PracticeLanguage): (verb: string) => number {
  const cache = new Map<string, number>();
  return (verb) => {
    let weight = cache.get(verb);
    if (weight === undefined) {
      weight = WEIGHTS[language.kindOf(verb, language.savedTable(verb))];
      cache.set(verb, weight);
    }
    return weight;
  };
}
