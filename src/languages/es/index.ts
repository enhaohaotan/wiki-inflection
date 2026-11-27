import { verbModule } from '../verbTables';
import { parseSpanishVerbTables } from './verb/parse';

/** Spanish verbs: their conjugation tables. */
export const spanish = verbModule({
  code: 'es',
  name: 'Spanish',
  spellingHint: 'Check the spelling, including accents (á, é, í, ó, ú, ñ).',
  parseTables: parseSpanishVerbTables,
});
