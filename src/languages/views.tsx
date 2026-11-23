import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { InflectionTable, LanguageEntry } from '../core/types';
import { DanishVerbView } from './da/verb/VerbView';
import { danishMainTable, danishTablesWithMatch } from './da/verb/layout';
import { ConjugationView } from './fr/verb/ConjugationView';
import { mainTable, tablesWithMatch } from './fr/verb/layout';

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
  /** The one table that stands for an entry after a reverse lookup. */
  main(entry: LanguageEntry, query: string): InflectionTable | undefined;
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
        ? entries.map((entry) => kit.main(entry, highlight)).filter((t) => t !== undefined)
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

  const table = tables[selected] ?? tables[0];
  if (!table) return null;
  const { Table } = kit;

  return (
    <div ref={root}>
      {tables.length > 1 && (
        <nav className="switcher" aria-label={highlight ? 'Form of' : 'Tables on this page'}>
          {highlight && <span className="label">Form of</span>}
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
              {t.lemma}
            </button>
          ))}
        </nav>
      )}
      <Table key={selected} table={table} highlight={highlight} />
    </div>
  );
}

const french: TableKit = {
  lang: 'fr',
  Table: ({ table, highlight }) => <ConjugationView table={table} idPrefix="t0-" highlight={highlight} />,
  withMatch: tablesWithMatch,
  // Pronominal variants (s'être) are left to a lookup of the verb itself.
  main: mainTable,
};

const danish: TableKit = {
  lang: 'da',
  Table: DanishVerbView,
  withMatch: danishTablesWithMatch,
  main: danishMainTable,
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
