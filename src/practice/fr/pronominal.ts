import type { Inflection, InflectionTable } from '../../core/types';

/**
 * Pronominal conjugations (se coucher, s'excuser) built from the plain verb's
 * table, for pronominal verbs Wiktionary has no table of its own for. Follows
 * the format of the pronominal tables Wiktionary does have (s'asseoir):
 *
 *   je m'assieds, nous nous asseyons      -> "m'assieds", "nous asseyons"
 *   assieds-toi, asseyons-nous            imperative: pronoun after the verb
 *   s'asseyant, s'asseoir                 participle and infinitive
 *   compound tenses with s'être, the participle agreeing with the subject
 */

const REFLEXIVE: Record<string, string> = { '1s': 'me', '2s': 'te', '3s': 'se', '1p': 'nous', '2p': 'vous', '3p': 'se' };
const IMPERATIVE: Record<string, string> = { '2s': 'toi', '1p': 'nous', '2p': 'vous' };

// me/te/se elide before a vowel or a mute h (je m'habille). Spelling can't
// tell an aspirated h (je me hâte); no verb on the practice list has one.
const ELIDES = /^[aàâäæeéèêëiîïoôöœuùûüyh]/i;

/** "se coucher" -> "coucher", "s'excuser" -> "excuser"; the verb itself when not pronominal. */
export function plainVerb(verb: string): string {
  return verb.replace(/^(?:se |s['’])/, '');
}

export function isPronominal(verb: string): boolean {
  return plainVerb(verb) !== verb;
}

/** "me" + "couche" -> "me couche"; "me" + "habille" -> "m'habille". */
function withReflexive(reflexive: string, form: string): string {
  return /^[mts]e$/.test(reflexive) && ELIDES.test(form) ? `${reflexive[0]}'${form}` : `${reflexive} ${form}`;
}

function pronominalForm(inflection: Inflection, form: string): string {
  const [first, num] = inflection.tags;
  if (first === '1' || first === '2' || first === '3') {
    const person = first + num;
    if (inflection.tags.includes('impr')) return `${form}-${IMPERATIVE[person] ?? ''}`;
    return withReflexive(REFLEXIVE[person]!, form);
  }
  // Infinitive and present participle: se coucher, se couchant.
  if (first === 'inf' || first === 'ppr') return withReflexive('se', form);
  // The past participle itself doesn't change: couché.
  return form;
}

/**
 * The agreed participle forms (couchée, couchés, couchées), needed now that
 * the compound tenses use être. Kept if the table has them, else made the
 * regular way: + e, + s (not after s or x), + es.
 */
function agreedParticiples(table: InflectionTable): Inflection[] {
  const has = (tags: string[]) => table.inflections.some((i) => i.tags.join('|') === tags.join('|'));
  const ms = table.inflections.find((i) => i.tags.length === 1 && i.tags[0] === 'pp')?.forms[0];
  if (!ms || has(['pp', 'f', 's'])) return [];
  const mp = /[sx]$/.test(ms) ? ms : `${ms}s`;
  return [
    { tags: ['pp', 'f', 's'], forms: [`${ms}e`], ipa: [] },
    { tags: ['pp', 'm', 'p'], forms: [mp], ipa: [] },
    { tags: ['pp', 'f', 'p'], forms: [`${ms}es`], ipa: [] },
  ];
}

/** "present indicative of avoir + past participle" -> "present indicative of s'être + past participle". */
function withSEtre(rule: string): string {
  return rule.replace(/(?<![\p{L}'’])(?:avoir|être)(?: or (?:avoir|être))?(?![\p{L}])/gu, "s'être");
}

/** The conjugation of `verb` (se coucher), built from its plain verb's table (coucher). */
export function pronominalTable(plain: InflectionTable, verb: string): InflectionTable {
  return {
    ...plain,
    lemma: verb,
    title: `Conjugation of ${verb}`,
    inflections: [
      ...plain.inflections.map((i) => ({ ...i, forms: i.forms.map((f) => pronominalForm(i, f)) })),
      ...agreedParticiples(plain),
    ],
    periphrastic: plain.periphrastic.map((p) => ({ ...p, rule: withSEtre(p.rule) })),
    meta: { ...plain.meta, auxiliary: "s'être" },
  };
}
