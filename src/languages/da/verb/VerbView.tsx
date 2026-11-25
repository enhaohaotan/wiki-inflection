import { useMemo } from 'react';
import type { InflectionTable } from '../../../core/types';
import { FormTable } from '../../../ui/FormTable';
import { Headword } from '../../../ui/Headword';
import { layoutDanishVerb, matchesDanishForm } from './layout';

interface Props {
  table: InflectionTable;
  highlight?: string;
}

/** A Danish verb: the basic forms, then the passive and the participle under small headings. */
export function DanishVerbView({ table, highlight }: Props) {
  const c = useMemo(() => layoutDanishVerb(table), [table]);
  return (
    <article className="conjugation">
      <Headword lemma={c.lemma} lang="da" pos={table.pos} />
      <FormTable
        lang="da"
        labels
        matches={highlight ? (f) => matchesDanishForm(f, highlight) : undefined}
        sections={c.sections.map((s) => ({
          title: s.title,
          rows: s.rows.map((r) => ({ label: r.label, cells: [{ forms: r.forms }] })),
        }))}
      />
    </article>
  );
}
