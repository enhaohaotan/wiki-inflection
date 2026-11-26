import { verbModule } from '../verbTables';
import { parseGermanVerbTables } from './verb/parse';

/** German verbs, for the practice page only. */
export const german = verbModule('de', 'German', parseGermanVerbTables);
