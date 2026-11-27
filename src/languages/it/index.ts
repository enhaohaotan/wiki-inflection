import { verbModule } from '../verbTables';
import { parseItalianVerbTables } from './verb/parse';

/** Italian verbs: their conjugation tables. */
export const italian = verbModule({
  code: 'it',
  name: 'Italian',
  spellingHint: 'Check the spelling, including the accent on a final vowel (parlò, sarà, è).',
  parseTables: parseItalianVerbTables,
});
