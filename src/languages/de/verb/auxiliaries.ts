/**
 * The German helping verbs, haben, sein and werden, in the tenses the built
 * forms use; fixed and regular in use, so kept here rather than fetched.
 * Then which of haben and sein to show for verbs that take both.
 */

/** The helping verbs' forms, ich to sie, by the tags of the tense. */
export const HABEN: Record<string, string[]> = {
  pres: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
  pret: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'],
  'sub:I': ['habe', 'habest', 'habe', 'haben', 'habet', 'haben'],
  'sub:II': ['hätte', 'hättest', 'hätte', 'hätten', 'hättet', 'hätten'],
};
export const SEIN: Record<string, string[]> = {
  pres: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
  pret: ['war', 'warst', 'war', 'waren', 'wart', 'waren'],
  'sub:I': ['sei', 'seist', 'sei', 'seien', 'seiet', 'seien'],
  'sub:II': ['wäre', 'wärst', 'wäre', 'wären', 'wärt', 'wären'],
};
export const WERDEN: Record<string, string[]> = {
  pres: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
  'sub:I': ['werde', 'werdest', 'werde', 'werden', 'werdet', 'werden'],
  'sub:II': ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden'],
};
export const AUXILIARIES: Record<string, Record<string, string[]>> = { haben: HABEN, sein: SEIN };

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
