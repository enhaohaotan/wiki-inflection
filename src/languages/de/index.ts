import { formOfTargets } from '../../wiktionary/page';
import type { LanguageModule } from '../registry';
import { parseGermanVerbTables } from './verb/parse';

/**
 * German verbs, for the practice page only: the lookup site has no German
 * view (it is not in the registry's list of languages).
 */
export const german: LanguageModule = {
  code: 'de',
  name: 'German',
  locale: 'de',
  heading: 'German',
  parse(section, pageTitle) {
    return { lang: 'de', title: pageTitle, tables: parseGermanVerbTables(section, pageTitle) };
  },
  lemmasOf(section) {
    // Verb forms: machte -> machen.
    return formOfTargets(section, 'de', (heading) => /^Verb\b/.test(heading));
  },
};
