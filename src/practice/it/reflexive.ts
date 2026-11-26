import type { Inflection, InflectionTable } from '../../core/types';

/**
 * Reflexive verbs (alzarsi). Wiktionary usually has a page with the
 * reflexive verb's own table; when it has none, the table is built from the
 * plain verb's (alzare): the pronoun before the verb (mi alzo), attached to
 * the imperative (alzati, alziamoci, alzatevi), and essere as the auxiliary.
 */

export function isReflexive(verb: string): boolean {
  return verb.endsWith('rsi');
}

/** "alzarsi" -> "alzare", "accorgersi" -> "accorgere". */
export function plainVerb(verb: string): string {
  return isReflexive(verb) ? `${verb.slice(0, -2)}e` : verb;
}

/** mi, ti, si, ci, vi, si. */
export const REFLEXIVE_PRONOUNS: Record<string, string> = {
  '1s': 'mi',
  '2s': 'ti',
  '3s': 'si',
  '1p': 'ci',
  '2p': 'vi',
  '3p': 'si',
};

function reflexiveForms(slot: Inflection): string[] | undefined {
  const [person, num, ...rest] = slot.tags;
  const key = `${person}${num}`;
  if (rest[0] === 'imp') {
    // Attached to tu, noi, voi (alzati); before Lei and Loro (si alzi).
    if (person === '3') return slot.forms.map((f) => `si ${f}`);
    // A shortened form (va', fa') doubles the pronoun's consonant; not built here.
    return slot.forms.filter((f) => !f.endsWith("'")).map((f) => `${f}${REFLEXIVE_PRONOUNS[key]}`);
  }
  const pronoun = REFLEXIVE_PRONOUNS[key];
  return pronoun ? slot.forms.map((f) => `${pronoun} ${f}`) : undefined;
}

export function reflexiveTable(plain: InflectionTable, verb: string): InflectionTable {
  const inflections: Inflection[] = [{ tags: ['inf'], forms: [verb], ipa: [] }, { tags: ['aux'], forms: ['essere'], ipa: [] }];
  for (const slot of plain.inflections) {
    const tags = slot.tags.join('|');
    if (tags === 'ger' || tags === 'past|part') {
      // As in Wiktionary's reflexive tables: alzandosi, alzatosi.
      inflections.push({ tags: slot.tags, forms: slot.forms.map((f) => `${f}si`), ipa: [] });
      continue;
    }
    if (!/^[123]\|[sp]\|/.test(tags)) continue;
    const forms = reflexiveForms(slot);
    if (forms?.length) inflections.push({ tags: slot.tags, forms, ipa: [] });
  }
  return { ...plain, lemma: verb, title: `Conjugation of ${verb}`, inflections };
}
