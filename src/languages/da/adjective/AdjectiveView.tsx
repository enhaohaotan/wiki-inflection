import { useMemo } from 'react';
import type { InflectionTable } from '../../../core/types';
import { FormTable } from '../../../ui/FormTable';
import { Headword } from '../../../ui/Headword';
import { matchesDanishForm } from '../verb/layout';
import { layoutDanishAdjective } from './layout';

interface Props {
  table: InflectionTable;
  highlight?: string;
}

/** A Danish adjective: gender/number and degree by indefinite and definite use. */
export function DanishAdjectiveView({ table, highlight }: Props) {
  const a = useMemo(() => layoutDanishAdjective(table), [table]);
  return (
    <article className="conjugation">
      <Headword lemma={a.lemma} lang="da" pos={table.pos} />
      <FormTable
        lang="da"
        labels
        columns={['Ubestemt', 'Bestemt']}
        matches={highlight ? (f) => matchesDanishForm(f, highlight) : undefined}
        sections={[
          { rows: a.rows.map((r) => ({ label: r.label, cells: [{ forms: r.indefinite }, { forms: r.definite }] })) },
        ]}
      />
    </article>
  );
}
