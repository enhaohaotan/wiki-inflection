import { verbModule } from '../verbTables';
import { parseSpanishVerbTables } from './verb/parse';

/** Spanish verbs, for the practice page only. */
export const spanish = verbModule('es', 'Spanish', parseSpanishVerbTables);
