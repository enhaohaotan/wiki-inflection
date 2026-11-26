import { verbModule } from '../verbTables';
import { parseItalianVerbTables } from './verb/parse';

/** Italian verbs, for the practice page only. */
export const italian = verbModule('it', 'Italian', parseItalianVerbTables);
