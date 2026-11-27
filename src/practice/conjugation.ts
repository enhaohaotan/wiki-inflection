import type { InflectionTable } from '../core/types';
import { lookup, type LookupResult } from '../features/lookup/lookup';
import { formMatcher, mainTable } from '../languages/conjugation';
import type { LanguageModule } from '../languages/registry';
import type { PracticeResult } from './types';

/**
 * What the practice code of every language shares besides the layout:
 * checking a stored table, and looking a verb up, building a reflexive
 * verb's table when Wiktionary has none.
 */

/** Whether a stored table has forms for each of `tags`; for PracticeLanguage.isComplete. */
export function hasForms(table: { inflections: { tags: string[]; forms: string[] }[] }, ...tags: string[]): boolean {
  return tags.every((t) => table.inflections.some((i) => i.tags.join('|') === t && i.forms.length > 0));
}

/** How a language's reflexive verbs are found or built. */
export interface ReflexiveVerbs {
  isReflexive(verb: string): boolean;
  /** "alzarsi" -> "alzare". */
  plainVerb(verb: string): string;
  /** The reflexive verb's table, built from the plain verb's. */
  build(plain: InflectionTable, verb: string): InflectionTable;
  /**
   * Whether Wiktionary may have a reflexive verb's own table, on its page or
   * on the plain verb's (chiamarsi, lavarse); if not (sich freuen), it is
   * always built.
   */
  ownTables: boolean;
  /** A form without the pronoun the table writes into it (mi chiamo -> chiamo), to match a looked-up form. */
  withoutReflexive(form: string): string;
}

/**
 * The table of `verb` in what Wiktionary returned. A page can hold several:
 * the plain and the reflexive verb (hablar, hablarse; être, s'être), or the
 * same verb with old forms too (the first is the standard one). A reflexive
 * verb needs its own table, not the plain verb's. After a reverse lookup
 * (suis), the plain verb's table if it has the form (être), else the first
 * that has it (suivre); else the first.
 */
function tableIn(result: LookupResult, verb: string, reflexive: ReflexiveVerbs): InflectionTable | undefined {
  if (result.status !== 'ok') return undefined;
  const { entry, match } = result;
  const own = entry.tables.find((t) => t.lemma === verb);
  if (own || reflexive.isReflexive(verb)) return own;
  if (!match) return entry.tables.find((t) => t.lemma === entry.title) ?? entry.tables[0];
  return mainTable(entry, match.form, formMatcher(reflexive.withoutReflexive));
}

/**
 * Looks up the table to practise `verb` with. A reflexive verb's own table
 * is looked for on its page and its plain verb's; failing that, it is built
 * from the plain verb's (levantarse from levantar).
 */
export async function practiceLookup(
  language: LanguageModule,
  reflexive: ReflexiveVerbs,
  verb: string,
  signal?: AbortSignal,
): Promise<PracticeResult> {
  // Credited to the page the table was read from; a table cached before
  // tables recorded it is credited to the page its lookup ended on.
  const ok = (from: LookupResult, table: InflectionTable, built = table): PracticeResult => ({
    status: 'ok',
    table: built,
    page: table.meta.page ?? (from.status === 'ok' ? from.entry.title : verb),
  });
  const isReflexive = reflexive.isReflexive(verb);
  const plain = reflexive.plainVerb(verb);

  let result: LookupResult | undefined;
  if (!isReflexive || reflexive.ownTables) {
    result = await lookup(language, verb, signal);
    const table = tableIn(result, verb, reflexive);
    if (table) return ok(result, table);
    if (!isReflexive) return result.status === 'ok' ? { status: 'no-inflection', query: verb } : result;
  }

  // The reflexive verb's page may already have led to the plain verb's (ducharse -> duchar).
  const plainResult = result && tableIn(result, plain, reflexive) ? result : await lookup(language, plain, signal);
  // Rate-limited or offline: say so, rather than that there is no table.
  if (plainResult.status === 'error') return plainResult;
  const own = reflexive.ownTables ? tableIn(plainResult, verb, reflexive) : undefined;
  if (own) return ok(plainResult, own);
  const plainTable = tableIn(plainResult, plain, reflexive);
  if (plainTable) return ok(plainResult, plainTable, reflexive.build(plainTable, verb));
  // Say why: the reflexive verb's own page if it was looked up, else the plain verb's.
  const reason = result ?? plainResult;
  return reason.status === 'ok' ? { status: 'no-inflection', query: verb } : reason;
}
