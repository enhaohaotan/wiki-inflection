import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { InflectionTable, LanguageEntry } from '../core/types';
import { DanishAdjectiveView } from './da/adjective/AdjectiveView';
import { DanishAdverbView } from './da/adverb/AdverbView';
import { DanishNounView } from './da/noun/NounView';
import { DanishNumeralView } from './da/numeral/NumeralView';
import { DanishPronounView } from './da/pronoun/PronounView';
import { DanishVerbView } from './da/verb/VerbView';
import { danishMainTables, danishTablesWithMatch } from './da/verb/layout';
import { ConjugationView } from './fr/verb/ConjugationView';
import { mainTable, tablesWithMatch } from './fr/verb/viewLayout';

export interface EntryViewProps {
  /**
   * Entries to show: one for a normal lookup; for a reverse lookup, every
   * dictionary form the looked-up form belongs to (suis -> être, suivre).
   */
  entries: LanguageEntry[];
  /** The entry to open first. */
  initial: LanguageEntry;
  /** An inflected form to highlight, when the lookup was a reverse lookup. */
  highlight?: string;
}

/** What each language plugs into the shared entry view. */
interface TableKit {
  lang: string;
  Table: ComponentType<{ table: InflectionTable; highlight?: string }>;
  /** For each table, whether it contains the looked-up form. */
  withMatch(tables: InflectionTable[], query: string | undefined): boolean[];
  /** The tables that stand for an entry after a reverse lookup. */
  main(entry: LanguageEntry, query: string): InflectionTable[];
  /** Short name of a part of speech, to tell apart same-named tables (spise: verb and noun). */
  posName?: Record<string, string>;
}

/**
 * Drops a table that repeats an earlier one: os is a form of vi, and both
 * pages carry the same table of all personal pronouns.
 */
function withoutRepeats(tables: InflectionTable[]): InflectionTable[] {
  const seen = new Set<string>();
  return tables.filter((t) => {
    const key = `${t.title}\n${JSON.stringify(t.inflections)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Switcher labels, as short as they can be while still telling tables apart:
 * - different words: the word (être · suivre);
 * - one word, several parts of speech: just the part of speech (sb. · vb.),
 *   since the headword below already names the word;
 * - a mix: the word, plus the part of speech where the word repeats;
 * - still the same (two noun declensions of øje): a number (sb. 1 · sb. 2).
 */
function tableLabels(tables: InflectionTable[], posName: Record<string, string> = {}): string[] {
  const pos = (t: InflectionTable) => posName[t.pos] ?? t.pos;
  const lemmas = new Set(tables.map((t) => t.lemma));
  const repeats = (t: InflectionTable) => tables.filter((u) => u.lemma === t.lemma).length > 1;
  const base = tables.map((t) =>
    lemmas.size === 1 ? pos(t) : repeats(t) ? `${t.lemma} ${pos(t)}` : t.lemma,
  );
  const seen = new Map<string, number>();
  return base.map((label) => {
    if (base.filter((l) => l === label).length < 2) return label;
    const n = (seen.get(label) ?? 0) + 1;
    seen.set(label, n);
    return `${label} ${n}`;
  });
}

/**
 * One table shown at a time, chosen from one row:
 * - looking up a word: its tables on the page (être · s'être · s'en être);
 * - looking up a form (suis): the words it belongs to, one table each
 *   (FORM OF être · suivre).
 * The row stays the same whichever item is selected.
 */
function EntryView({ entries, initial, highlight, kit }: EntryViewProps & { kit: TableKit }) {
  const root = useRef<HTMLDivElement>(null);
  const tables = useMemo(
    () =>
      highlight
        ? withoutRepeats(entries.flatMap((entry) => kit.main(entry, highlight)))
        : entries.flatMap((entry) => entry.tables),
    [entries, highlight, kit],
  );
  const matches = useMemo(() => kit.withMatch(tables, highlight), [tables, highlight, kit]);

  // Open the initial entry: its first table containing the form, else its first table.
  const start = useMemo(() => {
    const own = tables.map((t, i) => (initial.tables.includes(t) ? i : -1)).filter((i) => i >= 0);
    return own.find((i) => matches[i]) ?? own[0] ?? 0;
  }, [initial, tables, matches]);

  const [selected, setSelected] = useState(start);
  useEffect(() => setSelected(start), [start]);

  // Bring the first highlighted form into view, on load and after switching.
  useEffect(() => {
    if (!highlight) return;
    const frame = requestAnimationFrame(() => {
      root.current?.querySelector('.hit')?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [tables, highlight, selected]);

  const labels = useMemo(() => tableLabels(tables, kit.posName), [tables, kit]);
  // "Form of" only when every entry is another word; not when the word looked
  // up has an entry of its own as well (små is an adjective and lille's plural).
  const formOf = !!highlight && !entries.some((e) => e.title === highlight);
  const table = tables[selected] ?? tables[0];
  if (!table) return null;
  const { Table } = kit;

  return (
    <div ref={root}>
      {tables.length > 1 && (
        <nav className="switcher" aria-label={formOf ? 'Form of' : 'Tables on this page'}>
          {formOf && <span className="label">Form of</span>}
          {tables.map((t, i) => (
            <button
              key={`${i}:${t.title}`}
              type="button"
              lang={kit.lang}
              aria-pressed={i === selected}
              onClick={() => {
                window.scrollTo(0, 0);
                setSelected(i);
              }}
            >
              {labels[i]}
            </button>
          ))}
        </nav>
      )}
      {/* No highlight in the looked-up word's own table: there it is just the headword. */}
      <Table key={selected} table={table} highlight={table.lemma === highlight ? undefined : highlight} />
    </div>
  );
}

const french: TableKit = {
  lang: 'fr',
  Table: ({ table, highlight }) => <ConjugationView table={table} idPrefix="t0-" highlight={highlight} />,
  withMatch: tablesWithMatch,
  // Pronominal variants (s'être) are left to a lookup of the verb itself.
  main: (entry, query) => {
    const table = mainTable(entry, query);
    return table ? [table] : [];
  },
};

/** Danish pages can hold verbs, nouns, adjectives, adverbs and pronouns; each is drawn by its own view. */
function DanishTable({ table, highlight }: { table: InflectionTable; highlight?: string }) {
  if (table.pos === 'noun') return <DanishNounView table={table} highlight={highlight} />;
  if (table.pos === 'adjective') return <DanishAdjectiveView table={table} highlight={highlight} />;
  if (table.pos === 'adverb') return <DanishAdverbView table={table} highlight={highlight} />;
  if (table.pos === 'pronoun') return <DanishPronounView table={table} highlight={highlight} />;
  if (table.pos === 'numeral') return <DanishNumeralView table={table} highlight={highlight} />;
  return <DanishVerbView table={table} highlight={highlight} />;
}

const danish: TableKit = {
  lang: 'da',
  Table: DanishTable,
  withMatch: danishTablesWithMatch,
  main: danishMainTables,
  // Abbreviations used in Danish dictionaries: substantiv, verbum.
  posName: { verb: 'vb.', noun: 'sb.', adjective: 'adj.', adverb: 'adv.', pronoun: 'pron.', numeral: 'num.' },
};

const withKit = (kit: TableKit) =>
  function LanguageEntryView(props: EntryViewProps) {
    return <EntryView {...props} kit={kit} />;
  };

/** The component that renders an entry, per language code. */
export const entryViews: Record<string, ComponentType<EntryViewProps>> = {
  fr: withKit(french),
  da: withKit(danish),
};
