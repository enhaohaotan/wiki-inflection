import { useEffect, useRef, type ComponentType } from 'react';
import type { LanguageEntry } from '../core/types';
import { ConjugationView } from './fr/verb/ConjugationView';

export interface EntryViewProps {
  entry: LanguageEntry;
  /** An inflected form to highlight, when the lookup was a reverse lookup. */
  highlight?: string;
}

/** French: one conjugation per table (a page can hold several, e.g. asseoir / s'asseoir). */
function FrenchEntryView({ entry, highlight }: EntryViewProps) {
  const root = useRef<HTMLDivElement>(null);

  // After a reverse lookup, bring the first highlighted form into view.
  useEffect(() => {
    if (!highlight) return;
    const frame = requestAnimationFrame(() => {
      root.current?.querySelector('.hit')?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [entry, highlight]);

  return (
    <div ref={root}>
      {entry.tables.map((table, i) => (
        <ConjugationView key={i} table={table} idPrefix={`t${i}-`} highlight={highlight} />
      ))}
    </div>
  );
}

/** The component that renders an entry, per language code. */
export const entryViews: Record<string, ComponentType<EntryViewProps>> = {
  fr: FrenchEntryView,
};
