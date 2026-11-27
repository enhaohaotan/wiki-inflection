import { verbModule } from '../verbTables';
import { parseGermanVerbTables } from './verb/parse';

/** German verbs: their conjugation tables. */
export const german = verbModule({
  code: 'de',
  name: 'German',
  spellingHint: 'Check the spelling, including umlauts (ä, ö, ü) and ß.',
  parseTables: parseGermanVerbTables,
});
