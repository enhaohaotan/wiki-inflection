import type { LanguageModule } from '../registry';
import { formOfTargets } from '../../wiktionary/page';
import { parseDanishVerbTables } from './verb/parse';

export const danish: LanguageModule = {
  code: 'da',
  name: 'Danish',
  locale: 'da',
  heading: 'Danish',
  examples: ['være', 'have', 'gå', 'spise', 'lege', 'synes'],
  parse(section, pageTitle) {
    return { lang: 'da', title: pageTitle, tables: parseDanishVerbTables(section, pageTitle) };
  },
  lemmasOf(section) {
    return formOfTargets(section, 'da', (heading) => /^(Verb|Participle)\b/.test(heading));
  },
};
