import { useMemo } from 'react';
import type { InflectionTable } from '../../../core/types';
import { layoutDanishVerb, matchesDanishForm } from './layout';

interface Props {
  table: InflectionTable;
  highlight?: string;
}

function Forms({ forms, highlight }: { forms: string[]; highlight?: string }) {
  if (forms.length === 0) return <span className="missing">—</span>;
  return (
    <>
      {forms.map((form, i) => (
        <span key={form}>
          {i > 0 && <span className="or"> / </span>}
          <span className={highlight && matchesDanishForm(form, highlight) ? 'form hit' : 'form'}>{form}</span>
        </span>
      ))}
    </>
  );
}

/**
 * A Danish verb: the basic forms, then the passive and the participle under
 * small labels, all in one grid so the forms line up. Short enough that it
 * needs no section bar.
 */
export function DanishVerbView({ table, highlight }: Props) {
  const c = useMemo(() => layoutDanishVerb(table), [table]);

  return (
    <article className="conjugation">
      <header className="lemma">
        <h1 lang="da">{c.lemma}</h1>
      </header>

      <div className="dgrid" lang="da">
        {c.sections.map((section, i) => (
          <section key={i} className="dgrid-section">
            {section.title && <h3>{section.title}</h3>}
            {section.rows.map((row) => (
              <div key={row.label} className="dgrid-row">
                <span className="pron">{row.label}</span>
                <span>
                  <Forms forms={row.forms} highlight={highlight} />
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
