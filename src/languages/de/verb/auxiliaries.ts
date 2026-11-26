/**
 * The auxiliary to show for verbs Wiktionary gives both haben and sein,
 * with no footnote saying one is regional. Both are right, by meaning (ich
 * bin nach Berlin gefahren, ich habe das Auto gefahren) or by region (ich
 * habe gesessen in the north, bin gesessen in the south); the one shown is
 * the one a learner meets most, chosen by judgement, not from data. The
 * other is still accepted.
 */
export const USUAL_AUXILIARY: Record<string, 'haben' | 'sein'> = {
  anziehen: 'haben',
  aufstehen: 'sein',
  bekommen: 'haben',
  fahren: 'sein',
  fliegen: 'sein',
  hängen: 'haben',
  liegen: 'haben',
  passieren: 'sein',
  rennen: 'sein',
  schwimmen: 'sein',
  sitzen: 'haben',
  stehen: 'haben',
  tanzen: 'haben',
  // Moving house: ich bin umgezogen. (Changing clothes is sich umziehen.)
  umziehen: 'sein',
  // Pulling: ich habe gezogen. (Moving somewhere: ich bin gezogen.)
  ziehen: 'haben',
};
