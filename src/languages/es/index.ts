import { verbModule } from '../verbTables';
import { parseSpanishVerbTables } from './verb/parse';

/** Spanish verbs: their conjugation tables. */
export const spanish = verbModule({
  code: 'es',
  name: 'Spanish',
  spellingHint: 'Check the spelling, including accents (á, é, í, ó, ú, ñ).',
  flag: ['#aa151b', '#f1bf00', '#f1bf00', '#aa151b'],
  parseTables: parseSpanishVerbTables,
});
