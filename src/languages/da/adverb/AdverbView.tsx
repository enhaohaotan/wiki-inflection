import type { InflectionTable } from '../../../core/types';
import { FormTable } from '../../../ui/FormTable';
import { Headword } from '../../../ui/Headword';
import { matchesDanishForm } from '../verb/layout';

interface Props {
  table: InflectionTable;
  highlight?: string;
}

const ROWS: [string, string][] = [
  ['positive', 'Positiv'],
  ['comparative', 'Komparativ'],
  ['superlative', 'Superlativ'],
];

/** A Danish adverb's comparison: one column, no gender, number or definiteness. */
export function DanishAdverbView({ table, highlight }: Props) {
  const forms = (tag: string) => table.inflections.find((i) => i.tags[0] === tag)?.forms ?? [];
  return (
    <article className="conjugation">
      <Headword lemma={table.lemma} lang="da" pos={table.pos} />
      <FormTable
        lang="da"
        labels
        matches={highlight ? (f) => matchesDanishForm(f, highlight) : undefined}
        sections={[{ rows: ROWS.map(([tag, label]) => ({ label, cells: [{ forms: forms(tag) }] })) }]}
      />
    </article>
  );
}
