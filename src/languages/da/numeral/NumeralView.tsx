import { useMemo } from 'react';
import type { InflectionTable } from '../../../core/types';
import { FormTable, type FormCell } from '../../../ui/FormTable';
import { Headword } from '../../../ui/Headword';
import { matchesDanishForm } from '../verb/layout';
import { shortFirst, type NumeralGroup } from './parse';

interface Props {
  table: InflectionTable;
  highlight?: string;
}

/** 25 -> "25", 10000 -> "10.000", 1000000 -> "10⁶" (long numbers would not fit). */
export function formatValue(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (n < 1_000_000) return n.toLocaleString('da-DK');
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const exp = String(value.length - 1).replace(/\d/g, (d) => SUP[Number(d)]!);
  return `10${exp}`;
}

/**
 * A Danish numeral: its value, cardinal and ordinal, then the table of all
 * numerals with this one marked.
 */
export function DanishNumeralView({ table, highlight }: Props) {
  const forms = (tag: string) => table.inflections.find((i) => i.tags[0] === tag)?.forms ?? [];
  const groups = useMemo(() => JSON.parse(table.meta.total ?? '[]') as NumeralGroup[], [table]);
  const value = forms('value')[0];
  // The numeral itself is marked in the table; after a reverse lookup, the form looked up.
  const mark = highlight ?? table.lemma;
  const matches = (f: string) => matchesDanishForm(f, mark);

  return (
    <article className="conjugation">
      <Headword lemma={table.lemma} lang="da" pos="numeral" />
      <FormTable
        lang="da"
        labels
        sections={[
          {
            rows: [
              ...(value ? [{ label: 'Tal', cells: [{ forms: [formatValue(value)], plain: true }] }] : []),
              { label: 'Kardinaltal', cells: [{ forms: forms('cardinal') }] },
              { label: 'Ordinaltal', cells: [{ forms: forms('ordinal') }] },
            ],
          },
        ]}
      />
      {groups.length > 0 && <NumeralTotal groups={groups} matches={matches} />}
    </article>
  );
}

/**
 * Lets a long ordinal break, with a hyphen, before its last part when the
 * screen is narrow: halvfjerds-indstyvende, fyrre-tyvende.
 */
function breakable(form: string): string {
  return form.replace(/(?<=\p{L})(indstyvende|tyvende)$/u, '\u00AD$1');
}

/**
 * The table of all numerals, from Wiktionary's appendix. Also shown on the
 * home page. Only the main form is shown (tusinde, not also tusind; the
 * short ordinal of 40–90, halvtredsende, not halvtredsindstyvende), marked if
 * any form matches.
 */
export function NumeralTotal({
  groups,
  matches,
  apart = true,
}: {
  groups: NumeralGroup[];
  matches?: (form: string) => boolean;
  /** A rule across the top, setting it apart from the numeral above it. */
  apart?: boolean;
}) {
  const main = (all: string[]): FormCell => ({
    forms: all.slice(0, 1).map(breakable),
    hit: matches ? all.some(matches) : false,
  });
  return (
    <FormTable
      lang="da"
      className="ftable-breakable"
      labels
      topRule={apart}
      labelHeading="Tal"
      columns={['Kardinaltal', 'Ordinaltal']}
      sections={groups.map((g) => ({
        title: g.title,
        rows: g.rows.map((r) => ({
          label: formatValue(r.value),
          cells: [main(r.cardinal), main(shortFirst(r.ordinal))],
        })),
      }))}
    />
  );
}
