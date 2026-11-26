import { formOfTargets } from '../../wiktionary/page';
import type { LanguageModule } from '../registry';
import { parseItalianVerbTables } from './verb/parse';

/**
 * Italian verbs, for the practice page only: the lookup site has no Italian
 * view (it is not in the registry's list of languages).
 */
export const italian: LanguageModule = {
  code: 'it',
  name: 'Italian',
  locale: 'it',
  heading: 'Italian',
  parse(section, pageTitle) {
    return { lang: 'it', title: pageTitle, tables: parseItalianVerbTables(section, pageTitle) };
  },
  lemmasOf(section) {
    // Verb forms: parlo -> parlare.
    return formOfTargets(section, 'it', (heading) => /^Verb\b/.test(heading));
  },
};
