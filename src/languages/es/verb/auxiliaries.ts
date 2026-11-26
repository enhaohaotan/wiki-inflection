/**
 * haber, the Spanish auxiliary, conjugated in the simple tenses the
 * compound tenses are built from. Fixed and regular in use, so kept here
 * rather than fetched.
 */

/** haber's forms in each simple tense, yo to ellos, by the tense's tags. */
export const HABER: Record<string, string[]> = {
  'pres|ind': ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
  'impf|ind': ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían'],
  pret: ['hube', 'hubiste', 'hubo', 'hubimos', 'hubisteis', 'hubieron'],
  fut: ['habré', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán'],
  cond: ['habría', 'habrías', 'habría', 'habríamos', 'habríais', 'habrían'],
  'pres|sub': ['haya', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
  'impf|sub|ra': ['hubiera', 'hubieras', 'hubiera', 'hubiéramos', 'hubierais', 'hubieran'],
  'impf|sub|se': ['hubiese', 'hubieses', 'hubiese', 'hubiésemos', 'hubieseis', 'hubiesen'],
  'fut|sub': ['hubiere', 'hubieres', 'hubiere', 'hubiéremos', 'hubiereis', 'hubieren'],
};
