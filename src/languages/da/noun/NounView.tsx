import { useMemo } from 'react';
import type { InflectionTable } from '../../../core/types';
import { FormTable } from '../../../ui/FormTable';
import { Headword } from '../../../ui/Headword';
import { matchesDanishForm } from '../verb/layout';
import { layoutDanishNoun } from './layout';

interface Props {
  table: InflectionTable;
  highlight?: string;
}

/**
 * A Danish noun, in the same grid as the adjectives:
 *
 *            UBESTEMT   BESTEMT
 *   Ental    et hus     huset
 *   Flertal  huse       husene
 */
export function DanishNounView({ table, highlight }: Props) {
  const n = useMemo(() => layoutDanishNoun(table), [table]);
  return (
    <article className="conjugation">
      <Headword lemma={n.lemma} lang="da" pos={table.pos} />
      <FormTable
        lang="da"
        labels
        columns={['Ubestemt', 'Bestemt']}
        matches={highlight ? (f) => matchesDanishForm(f, highlight) : undefined}
        sections={[
          {
            rows: n.rows.map((row, i) => ({
              label: row.label,
              cells: [
                // the article goes before the indefinite singular only: en bil, et hus
                { forms: row.indefinite, prefix: i === 0 ? n.article : undefined },
                { forms: row.definite },
              ],
            })),
          },
        ]}
      />
    </article>
  );
}
