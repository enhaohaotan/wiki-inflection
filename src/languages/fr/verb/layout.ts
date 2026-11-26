import type { InflectionTable } from '../../../core/types';
import { layOut, type ConjugationLayout, type Language } from '../../conjugation';
import { PERSONS } from '../../verbTables';
import { auxiliariesInRule, type AuxiliaryUse, type AuxTense } from './auxiliaries';
import { expandForm } from './notation';
import { compoundForm, participleOf, pronounFor, slotOf, type Num, type ParticipleForms, type Person } from './words';

/**
 * French, described for the shared engine (../../conjugation.ts): its moods
 * and tenses, and how a compound form is spelled (./words.ts). The simple
 * tenses come from the table; a compound tense is the auxiliary Wiktionary's
 * rule for it names (avoir, être, or both) and the past participle, which
 * agrees after être (suis allé(e)). Answers are written in the viewer's
 * notation (allé(e)(s), dissous / dissoute), spelled out for checking.
 */

/** A compound tense: Wiktionary's rule for it, which names the auxiliary, and the auxiliary's tense. */
interface Build {
  rule: string;
  auxTense: AuxTense;
}

interface Verb {
  table: InflectionTable;
  participle: ParticipleForms | null;
}

const IMPERATIVE_PERSONS = [
  ['2', 's'],
  ['1', 'p'],
  ['2', 'p'],
] as const;

/** A simple tense and the compound tense built on it. */
function pair(simple: string, tags: AuxTense, compound: string, rule: string, folded = false) {
  return [
    { name: simple, tags: [tags], folded },
    { name: compound, build: { rule, auxTense: tags }, on: tags },
  ];
}

/**
 * Folded at first, besides the compound tenses: the tenses of written
 * narrative only (passé simple; imperfect subjunctive).
 */
export const FRENCH: Language<Verb, Build, AuxiliaryUse> = {
  moods: [
    {
      id: 'indicatif',
      name: 'Indicatif',
      short: 'Ind.',
      kind: 'plain',
      persons: PERSONS,
      pairs: [
        pair('Présent', 'pres|indc', 'Passé composé', 'indicative:present perfect'),
        pair('Imparfait', 'impf|indc', 'Plus-que-parfait', 'indicative:pluperfect'),
        pair('Passé simple', 'phis', 'Passé antérieur', 'indicative:past anterior', true),
        pair('Futur simple', 'futr', 'Futur antérieur', 'indicative:future perfect'),
      ],
    },
    {
      id: 'conditionnel',
      name: 'Conditionnel',
      short: 'Cond.',
      kind: 'plain',
      persons: PERSONS,
      pairs: [pair('Présent', 'cond', 'Passé', 'indicative:conditional perfect')],
    },
    {
      id: 'subjonctif',
      name: 'Subjonctif',
      short: 'Subj.',
      kind: 'subjunctive',
      persons: PERSONS,
      pairs: [
        pair('Présent', 'pres|subj', 'Passé', 'subjunctive:past'),
        pair('Imparfait', 'impf|subj', 'Plus-que-parfait', 'subjunctive:pluperfect', true),
      ],
    },
    {
      id: 'imperatif',
      name: 'Impératif',
      short: 'Impér.',
      kind: 'imperative',
      persons: IMPERATIVE_PERSONS,
      pairs: [pair('Présent', 'impr', 'Passé', 'imperative:compound')],
    },
  ],

  forms: [
    {
      id: 'participe',
      name: 'Participe',
      short: 'Part.',
      tense: 'Participe',
      rows({ table }) {
        // The infinitive is the headword itself, so only the participles are asked.
        return [
          ['ppr', 'présent'],
          ['pp', 'passé'],
        ].flatMap(([tag, label]) => {
          const slot = slotOf(table, [tag!]);
          if (!slot) return [];
          // The agreed forms (allée, allés, allées) are right too.
          const agreed =
            tag === 'pp' ? table.inflections.filter((i) => i.tags[0] === 'pp' && i.tags.length === 3).flatMap((i) => i.forms) : [];
          return [{ label: label!, shown: slot.forms, accepted: [...new Set([...slot.forms, ...agreed].flatMap(expandForm))] }];
        });
      },
    },
  ],

  // Elided as written before the form (j’ai, que j’aille).
  subject: ([person, num], kind, form) => pronounFor(person as Person, num as Num, kind, form),

  verb: (table) => ({ table, participle: participleOf(table) }),

  auxiliaries({ table, participle }, build, kind) {
    const rule = table.periphrastic.find((p) => p.key === build.rule);
    if (!rule || !participle) return { shown: [], also: [] };
    const uses = auxiliariesInRule(rule.rule);
    // A compound imperative of a pronominal verb is not used.
    return { shown: kind === 'imperative' ? uses.filter((u) => !u.reflexive) : uses, also: [] };
  },

  build({ participle }, build, use, [person, num]) {
    const form = compoundForm(use, build.auxTense, person as Person, num as Num, participle!);
    return form ? { shown: [form], accepted: expandForm(form) } : { shown: [], accepted: [] };
  },

  accepts: expandForm,
};

export function conjugationLayout(table: InflectionTable): ConjugationLayout {
  return layOut(FRENCH, table);
}
