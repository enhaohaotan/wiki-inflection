import { verbModule } from '../verbTables';
import { parseFrenchVerbTables } from './verb/parse';
import { enrichParticiples } from './verb/participle';

/** French verbs: their conjugation tables, with the agreed participle forms from the participle's page. */
export const french = verbModule({
  code: 'fr',
  name: 'French',
  spellingHint: 'Check the spelling, including accents (é, è, ê, ç).',
  parseTables: parseFrenchVerbTables,
  // Verb forms (vais -> aller) and participle forms (allée -> allé).
  formHeadings: /^(Verb|Participle)\b/,
  enrich: enrichParticiples,
});
