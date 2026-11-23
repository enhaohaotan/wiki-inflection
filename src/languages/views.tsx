import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { LanguageEntry } from '../core/types';
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

/**
 * French, one conjugation shown at a time, chosen from one row:
 * - looking up a verb: its conjugations on the page (être · s'être · s'en être);
 * - looking up a form (suis): the verbs it belongs to, one table each
 *   (FORM OF être · suivre). Pronominal variants are left out here; looking
 *   up the verb itself shows them.
 * The row stays the same whichever item is selected.
 */
function FrenchEntryView({ entries, initial, highlight }: EntryViewProps) {
  const root = useRef<HTMLDivElement>(null);
  const tables = useMemo(
    () =>
      highlight
        ? entries.map((entry) => mainTable(entry, highlight)).filter((t) => t !== undefined)
        : entries.flatMap((entry) => entry.tables),
    [entries, highlight],
  );
  const matches = useMemo(() => tablesWithMatch(tables, highlight), [tables, highlight]);

  // Open the initial entry: its first table containing the form, else its first table.
  const start = useMemo(() => {
    const own = initial.tables.map((t) => tables.indexOf(t));
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

  return (
    <div ref={root}>
      {tables.length > 1 && (
        <nav className="switcher" aria-label={highlight ? 'Form of' : 'Conjugations on this page'}>
          {highlight && <span className="label">Form of</span>}
          {tables.map((t, i) => (
            <button
              key={`${i}:${t.title}`}
              type="button"
              lang="fr"
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
      <ConjugationView key={selected} table={table} idPrefix="t0-" highlight={highlight} />
    </div>
  );
}

/** The component that renders an entry, per language code. */
export const entryViews: Record<string, ComponentType<EntryViewProps>> = {
  fr: FrenchEntryView,
};
