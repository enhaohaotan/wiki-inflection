import { useMemo } from 'react';
import type { InflectionTable } from '../../../core/types';
import { FormTable, type FormRow } from '../../../ui/FormTable';
import { Headword } from '../../../ui/Headword';
import { matchesDanishForm } from '../verb/layout';
import { layoutPersonal, personalRows, type PersonalLine } from './layout';
import type { PersonalRow } from './parse';

interface Props {
  table: InflectionTable;
  highlight?: string;
}

/** A row of the personal pronoun table; the nominative doubles as its label. */
function personalRow(line: PersonalLine): FormRow {
  return {
    cells: [
      { forms: line.nominative ? [line.nominative] : [] },
      { forms: line.oblique ? [line.oblique] : [] },
      // common · neuter · plural, a series rather than alternatives
      { forms: line.possessive, separator: ' · ' },
    ],
  };
}

/**
 * The table of all personal pronouns: singular, plural, De and vor after a
 * rule, then the reflexive on its own. Also shown on the home page.
 */
export function PersonalTable({ rows, matches }: { rows: PersonalRow[]; matches?: (form: string) => boolean }) {
  const layout = useMemo(() => layoutPersonal(rows), [rows]);
  return (
    <article className="conjugation">
      {/* A table of all of them, not of the word looked up: "stedord ... PERSONLIGE". */}
      <Headword lemma="stedord" lang="da" pos="pronoun" label="personlige" />
      <FormTable
        lang="da"
        columns={['Nominativ', 'Akkusativ', 'Possessiv']}
        widths={['max-content', 'max-content', 'minmax(0, 1fr)']}
        matches={matches}
        sections={[
          { rows: layout.singular.map(personalRow) },
          { rule: true, rows: layout.plural.map(personalRow) },
          ...(layout.other.length ? [{ rule: true, rows: layout.other.map(personalRow) }] : []),
          ...(layout.reflexive ? [{ title: 'Refleksiv', rows: [personalRow(layout.reflexive)] }] : []),
        ]}
      />
    </article>
  );
}

function PersonalView({ table, highlight }: Props) {
  const rows = useMemo(() => personalRows(table), [table]);
  // On a direct lookup the word itself is marked; after a reverse lookup, the form looked up.
  const mark = highlight ?? table.lemma;
  return <PersonalTable rows={rows} matches={(f) => matchesDanishForm(f, mark)} />;
}

const GENDERED: [string, string][] = [
  ['common', 'Fælleskøn'],
  ['neuter', 'Intetkøn'],
  ['plural', 'Flertal'],
];

/** A pronoun that changes for gender and number, like an adjective (denne, dette, disse). */
function GenderedView({ table, highlight }: Props) {
  const forms = (tag: string) => table.inflections.find((i) => i.tags[0] === tag)?.forms ?? [];
  return (
    <article className="conjugation">
      <Headword lemma={table.lemma} lang="da" pos="pronoun" />
      <FormTable
        lang="da"
        labels
        matches={highlight ? (f) => matchesDanishForm(f, highlight) : undefined}
        sections={[{ rows: GENDERED.map(([tag, label]) => ({ label, cells: [{ forms: forms(tag) }] })) }]}
      />
    </article>
  );
}

export function DanishPronounView(props: Props) {
  return props.table.meta.kind === 'personal' ? <PersonalView {...props} /> : <GenderedView {...props} />;
}
