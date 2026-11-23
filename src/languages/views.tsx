import type { ComponentType } from 'react';
import type { LanguageEntry } from '../core/types';
import { ConjugationView } from './fr/verb/ConjugationView';

export interface EntryViewProps {
  entry: LanguageEntry;
}

/** French: one conjugation per table (a page can hold several, e.g. asseoir / s'asseoir). */
function FrenchEntryView({ entry }: EntryViewProps) {
  return (
    <>
      {entry.tables.map((table, i) => (
        <ConjugationView key={i} table={table} idPrefix={`t${i}-`} />
      ))}
    </>
  );
}

/** The component that renders an entry, per language code. */
export const entryViews: Record<string, ComponentType<EntryViewProps>> = {
  fr: FrenchEntryView,
};
