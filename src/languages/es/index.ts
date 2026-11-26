import { formOfTargets } from '../../wiktionary/page';
import type { LanguageModule } from '../registry';
import { parseSpanishVerbTables } from './verb/parse';

/**
 * Spanish verbs, for the practice page only: the lookup site has no Spanish
 * view (it is not in the registry's list of languages).
 */
export const spanish: LanguageModule = {
  code: 'es',
  name: 'Spanish',
  locale: 'es',
  heading: 'Spanish',
  parse(section, pageTitle) {
    return { lang: 'es', title: pageTitle, tables: parseSpanishVerbTables(section, pageTitle) };
  },
  lemmasOf(section) {
    // Verb forms: hablo -> hablar.
    return formOfTargets(section, 'es', (heading) => /^Verb\b/.test(heading));
  },
};
