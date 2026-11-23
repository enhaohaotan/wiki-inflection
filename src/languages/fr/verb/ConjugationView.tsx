import { useMemo, type CSSProperties } from 'react';
import type { InflectionTable } from '../../../core/types';
import { layoutConjugation, type FormRow, type MoodBlock, type TenseBlock, type TensePair } from './layout';

interface Props {
  table: InflectionTable;
  /** Prefix for element ids, so several tables can share a page. */
  idPrefix: string;
}

/**
 * "je" + "vais" -> "je vais"; "j’" + "ai" -> "j’ai". With several forms the
 * pronoun is repeated only where it changes: "il a passé / est passé(e)",
 * "j’ai passé / je suis passé(e)".
 */
function Cell({ row }: { row: FormRow }) {
  if (row.parts.length === 0) {
    return (
      <div className="cell missing" lang="fr">
        <span className="pron">{row.pronoun}</span> —
      </div>
    );
  }
  return (
    <div className="cell" lang="fr">
      {row.parts.map((part, i) => (
        <span key={i} className="part">
          {i > 0 && <span className="or"> / </span>}
          {(i === 0 || part.pronoun !== row.parts[i - 1]!.pronoun) && (
            <>
              <span className="pron">{part.pronoun}</span>
              {part.pronoun.endsWith('’') ? '' : ' '}
            </>
          )}
          <span className="form">
            <Words text={part.form} />
          </span>
        </span>
      ))}
    </div>
  );
}

/** Abbreviations used in the section bar; headings keep the full names. */
const SHORT_NAMES: Record<string, string> = {
  indicatif: 'Ind.',
  conditionnel: 'Cond.',
  subjonctif: 'Subj.',
  imperatif: 'Impér.',
  participe: 'Part.',
};

/** Lets a line break between words but not inside one, e.g. allé(e)(s). */
function Words({ text }: { text: string }) {
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

/** One tense as its own column: name, then one line per person. */
function Column({ tense }: { tense: TenseBlock }) {
  return (
    <section className="col">
      <h3 lang="fr">{tense.fr}</h3>
      {tense.rows.map((row, i) => (
        <Cell key={i} row={row} />
      ))}
    </section>
  );
}

/**
 * A simple tense and its compound tense as two separate, equal-width columns.
 * The columns share row heights (CSS subgrid), so each person stays on one
 * line across both even when a form wraps.
 */
function Pair({ pair }: { pair: TensePair }) {
  const { simple, compound } = pair;
  const style = { '--rows': simple.rows.length + 1 } as CSSProperties;
  return (
    <div className="pair" style={style}>
      <Column tense={simple} />
      {compound && <Column tense={compound} />}
    </div>
  );
}

function Mood({ mood, id }: { mood: MoodBlock; id: string }) {
  return (
    <section className="mood" id={id}>
      <h2 lang="fr">{mood.fr}</h2>
      {mood.pairs.map((pair) => (
        <Pair key={pair.simple.fr} pair={pair} />
      ))}
    </section>
  );
}

export function ConjugationView({ table, idPrefix }: Props) {
  const c = useMemo(() => layoutConjugation(table), [table]);
  const sections = [
    ...c.moods.map((m) => ({ id: m.id, fr: m.fr })),
    ...(c.participles.length > 0 ? [{ id: 'participe', fr: 'Participe' }] : []),
  ];

  return (
    <article className="conjugation">
      <header className="lemma">
        <h1 lang="fr">{c.lemma}</h1>
      </header>

      <nav className="jump" aria-label="Sections">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${idPrefix}${s.id}`}
            onClick={(e) => jumpTo(e, idPrefix + s.id)}
            lang="fr"
            title={s.fr}
            aria-label={s.fr}
          >
            {SHORT_NAMES[s.id] ?? s.fr}
          </a>
        ))}
      </nav>

      {c.moods.map((m) => (
        <Mood key={m.id} mood={m} id={idPrefix + m.id} />
      ))}

      {c.participles.length > 0 && (
        <section className="mood" id={`${idPrefix}participe`}>
          <h2 lang="fr">Participe</h2>
          <div className="pair" style={{ '--rows': 2 } as CSSProperties}>
            {c.participles.map((p) => (
              <section key={p.fr} className="col">
                <h3 lang="fr">{p.fr}</h3>
                <div className="cell" lang="fr">
                  <span className="form">{p.forms.join(' / ')}</span>
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

/** Scrolls to a mood without touching the URL hash, which holds the current word. */
function jumpTo(e: React.MouseEvent, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
