import { Fragment, type CSSProperties, type ReactNode } from 'react';

/**
 * The one table every inflection page is drawn with: optional row labels,
 * optional column headings, rows grouped into sections. Pages only describe
 * their data; lines, spacing and highlighting are the same everywhere.
 *
 *               UBESTEMT   BESTEMT        <- columns
 *   Ental       et hus     huset          <- row: label + cells
 *   Flertal     huse       husene
 *   PASSIV                                <- section title (rule above)
 *   ...
 */

/** One cell: its forms, shown joined; [] shows a dash. */
export interface FormCell {
  forms: string[];
  /** Shown before the forms in grey, e.g. the article in "et hus". */
  prefix?: string;
  /** Between forms: " / " for alternatives (default), " · " for a series (min · mit · mine). */
  separator?: string;
  /** Marks the cell even if no form shown matches (a hidden alternative did). */
  hit?: boolean;
  /** Shown as is, not marked: e.g. the number "25". */
  plain?: boolean;
}

export interface FormRow {
  /** Grey row label (Præsens, Ental, ...); none when the table has no label column. */
  label?: ReactNode;
  /** null leaves the cell empty: nothing there at all, not even a dash. */
  cells: (FormCell | null)[];
}

export interface FormSection {
  /** Small uppercase heading with a rule above (PASSIV, TIERE, ...). */
  title?: string;
  /** A light rule above an untitled section (singular | plural). */
  rule?: boolean;
  rows: FormRow[];
}

interface Props {
  lang: string;
  sections: FormSection[];
  /** Column headings (not counting the label column). */
  columns?: string[];
  /** Whether rows have labels in a first, grey column. */
  labels?: boolean;
  /** Heading of the label column, when it has one (TAL). */
  labelHeading?: string;
  /** A rule across the top, setting the table apart from what is above it. */
  topRule?: boolean;
  /** CSS widths of the data columns; by default each is at least its longest word. */
  widths?: string[];
  /** Whether a form is the one looked up. */
  matches?: (form: string) => boolean;
  /** An extra class, e.g. to let long words break. */
  className?: string;
}

export function Forms({ cell, matches }: { cell: FormCell; matches?: (form: string) => boolean }) {
  if (cell.forms.length === 0) return <span className="missing">—</span>;
  return (
    <>
      {cell.prefix && <span className="muted">{cell.prefix} </span>}
      {cell.forms.map((form, i) => {
        const hit = !cell.plain && (cell.hit || (matches?.(form) ?? false));
        return (
          <span key={i}>
            {i > 0 && <span className="muted">{cell.separator ?? ' / '}</span>}
            <span className={hit ? 'form hit' : 'form'}>
              <Words text={form} />
            </span>
          </span>
        );
      })}
    </>
  );
}

/** Lets a line break between words but not inside one, e.g. allé(e)(s). */
export function Words({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && ' '}
          <span className="word">{word}</span>
        </span>
      ))}
    </>
  );
}

export function FormTable({
  lang,
  sections,
  columns,
  labels = false,
  labelHeading,
  topRule = false,
  widths,
  matches,
  className,
}: Props) {
  const dataColumns = columns?.length ?? Math.max(1, ...sections.flatMap((s) => s.rows.map((r) => r.cells.length)));
  const template = [
    ...(labels ? ['max-content'] : []),
    ...Array.from({ length: dataColumns }, (_, i) => widths?.[i] ?? 'minmax(min-content, 1fr)'),
  ].join(' ');
  const style: CSSProperties = { gridTemplateColumns: template };

  return (
    <div className={['ftable', topRule && 'ftable-apart', className].filter(Boolean).join(' ')} style={style} lang={lang}>
      {topRule && <div className="ftable-rule ftable-rule-strong" />}
      {columns && (
        <>
          {labels && (labelHeading ? <h3 className="ftable-col">{labelHeading}</h3> : <span />)}
          {columns.map((c) => (
            <h3 key={c} className="ftable-col">
              {c}
            </h3>
          ))}
        </>
      )}
      {sections.map((section, s) => (
        <Fragment key={s}>
          {section.title && (
            // Right under the column headings, the title needs no rule of its own.
            <h3 className={s === 0 && columns ? 'ftable-title first' : 'ftable-title'}>{section.title}</h3>
          )}
          {!section.title && section.rule && <div className="ftable-rule" />}
          {section.rows.map((row, r) => (
            <Fragment key={r}>
              {labels && <span className="ftable-label">{row.label}</span>}
              {Array.from({ length: dataColumns }, (_, c) => {
                const cell = row.cells[c];
                return <span key={c}>{cell ? <Forms cell={cell} matches={matches} /> : null}</span>;
              })}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
