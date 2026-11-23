import type { Inflection, InflectionTable } from '../../core/types';
import type { LanguageModule } from '../registry';
import { auxiliariesInRule } from './verb/auxiliaries';
import { parseFrenchVerbTables } from './verb/parse';
import { parseParticipleForms } from './verb/participle';

function pastParticiple(table: InflectionTable): string | undefined {
  return table.inflections.find((i) => i.tags.length === 1 && i.tags[0] === 'pp')?.forms[0];
}

/** Whether any compound tense uses être, where the participle agrees with the subject. */
function usesEtre(table: InflectionTable): boolean {
  return table.periphrastic.some((p) => auxiliariesInRule(p.rule).some((u) => u.auxiliary === 'être'));
}

export const french: LanguageModule = {
  code: 'fr',
  name: 'French',
  heading: 'French',
  parse(section, pageTitle) {
    const tables = parseFrenchVerbTables(section, pageTitle);
    // A page can hold several conjugations (asseoir / s'asseoir): show the one asked for first.
    const asked = tables.filter((t) => t.lemma === pageTitle);
    const others = tables.filter((t) => t.lemma !== pageTitle);
    return { lang: 'fr', title: pageTitle, tables: [...asked, ...others] };
  },

  async enrich(entry, fetchSection) {
    // The conjugation table only has the masculine singular participle; the
    // agreed forms (allée, allés, allées) are on the participle's own page.
    const wanted = new Set(entry.tables.filter(usesEtre).map(pastParticiple).filter((p) => p !== undefined));
    if (wanted.size === 0) return entry;

    const forms = new Map<string, Inflection[]>();
    for (const participle of wanted) {
      const section = await fetchSection(participle);
      forms.set(participle, section ? parseParticipleForms(section) : []);
    }

    return {
      ...entry,
      tables: entry.tables.map((table) => {
        const extra = usesEtre(table) ? forms.get(pastParticiple(table) ?? '') : undefined;
        return extra?.length ? { ...table, inflections: [...table.inflections, ...extra] } : table;
      }),
    };
  },
};
