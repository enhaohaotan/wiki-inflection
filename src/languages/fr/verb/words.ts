import { hasTags, type Inflection, type InflectionTable } from '../../../core/types';
import { AUXILIARY_FORMS, type AuxiliaryUse, type AuxTense } from './auxiliaries';

/**
 * How French words are put together in a conjugation: the subject pronoun
 * and its elision (j'ai, qu'il), the participle's agreement (allé(e)s), and
 * a compound form from the auxiliary (suis allé(e), me suis assis(e)).
 * Used by the conjugation viewer's layout and by the shared layout engine.
 */

export type Person = '1' | '2' | '3';
export type Num = 's' | 'p';
export type MoodKind = 'plain' | 'subjunctive' | 'imperative';

const PRONOUNS: Record<string, string> = {
  '1s': 'je',
  '2s': 'tu',
  '3s': 'il/elle/on',
  '1p': 'nous',
  '2p': 'vous',
  '3p': 'ils/elles',
};

export const REFLEXIVE_PRONOUNS: Record<string, string> = {
  '1s': 'me',
  '2s': 'te',
  '3s': 'se',
  '1p': 'nous',
  '2p': 'vous',
  '3p': 'se',
};

export const VOWEL_START = /^[aàâäæeéèêëiîïoôöœuùûüy]/i;

/**
 * Subject pronoun as it is written before `form`, including elision
 * (je -> j’ before a vowel sound; que -> qu’ before il/ils).
 */
export function pronounFor(person: Person, num: Num, kind: MoodKind, form: string | undefined): string {
  const base = PRONOUNS[person + num] ?? '';
  if (kind === 'imperative') return `(${base})`;

  let pronoun = base;
  if (person === '1' && num === 's' && form) {
    if (VOWEL_START.test(form)) pronoun = 'j’';
    // Spelling can't tell a mute h (j’habite) from an aspirated one (je hais).
    else if (/^h/i.test(form)) pronoun = 'je (j’)';
  }
  if (kind === 'subjunctive') {
    return person === '3' ? `qu’${pronoun}` : `que ${pronoun}`;
  }
  return pronoun;
}

/** Participle forms that agree with the subject: masculine/feminine, singular/plural. */
export interface ParticipleForms {
  ms: string;
  fs?: string;
  mp?: string;
  fp?: string;
}

/**
 * Compact textbook notation for the participle forms a subject can take,
 * e.g. allé(e), allé(e)s, allé(e)(s); "dissous / dissoute" when the forms
 * don't share a stem.
 */
export function agreementNotation(person: Person, num: Num, p: ParticipleForms): string {
  const variants =
    num === 's'
      ? [p.ms, p.fs]
      : person === '2'
        ? // vous can address one person or several
          [p.ms, p.fs, p.mp, p.fp]
        : [p.mp, p.fp];
  const forms = [...new Set(variants.filter((v): v is string => Boolean(v)))];
  if (forms.length === 0) return p.ms;
  if (forms.length === 1) return forms[0]!;

  if (forms.every((f) => f.startsWith(p.ms))) {
    const suffixes = new Set(forms.map((f) => f.slice(p.ms.length)));
    const is = (...want: string[]) => suffixes.size === want.length && want.every((w) => suffixes.has(w));
    if (is('', 'e')) return `${p.ms}(e)`;
    if (is('s', 'es')) return `${p.ms}(e)s`;
    if (is('', 'es')) return `${p.ms}(es)`;
    if (is('', 's')) return `${p.ms}(s)`;
    if (is('', 'e', 's', 'es') || is('', 'e', 'es')) return `${p.ms}(e)(s)`;
  }
  return forms.join(' / ');
}

/** The slot with exactly these tags, in any order. */
export function slotOf(table: InflectionTable, tags: string[]): Inflection | undefined {
  return table.inflections.find((i) => i.tags.length === tags.length && hasTags(i, tags));
}

export function participleOf(table: InflectionTable): ParticipleForms | null {
  const ms = slotOf(table, ['pp'])?.forms[0];
  if (!ms) return null;
  return {
    ms,
    fs: slotOf(table, ['pp', 'f', 's'])?.forms[0],
    mp: slotOf(table, ['pp', 'm', 'p'])?.forms[0],
    fp: slotOf(table, ['pp', 'f', 'p'])?.forms[0],
  };
}

/** One way of forming a compound tense for one person, e.g. "suis allé(e)". */
export function compoundForm(
  use: AuxiliaryUse,
  auxTense: AuxTense,
  person: Person,
  num: Num,
  participle: ParticipleForms,
): string | null {
  const aux = AUXILIARY_FORMS[use.auxiliary][auxTense][person + num];
  if (!aux) return null;
  // With être the participle agrees with the subject; with avoir it does not.
  const pp = use.auxiliary === 'être' ? agreementNotation(person, num, participle) : participle.ms;
  if (!use.reflexive) return `${aux} ${pp}`;
  const reflexive = REFLEXIVE_PRONOUNS[person + num]!;
  // me/te/se elide before a vowel: before "en" always (m'en suis), else as the auxiliary starts.
  const next = use.en ? `en ${aux}` : aux;
  const clitics = /^[mts]e$/.test(reflexive) && VOWEL_START.test(next) ? `${reflexive[0]}'${next}` : `${reflexive} ${next}`;
  return `${clitics} ${pp}`;
}
