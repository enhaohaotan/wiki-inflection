import { useMemo, type CSSProperties } from 'react';
import { Words } from '../../../ui/FormTable';
import { Headword } from '../../../ui/Headword';
import { JumpNav } from '../../../ui/JumpNav';
import type { InflectionTable } from '../../../core/types';
import { layoutConjugation, matchesForm, type FormRow, type MoodBlock, type TenseBlock, type TensePair } from './viewLayout';

interface Props {
  table: InflectionTable;
  /** Prefix for element ids, so several tables can share a page. */
  idPrefix: string;
  /** Inflected form to highlight, from a reverse lookup. */
  highlight?: string;
}

/**
 * "je" + "vais" -> "je vais"; "j’" + "ai" -> "j’ai". With several forms the
 * pronoun is repeated only where it changes: "il a passé / est passé(e)",
 * "j’ai passé / je suis passé(e)".
 */
function Cell({ row, highlight }: { row: FormRow; highlight?: string }) {
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
          <span className={highlight && matchesForm(part.form, highlight) ? 'form hit' : 'form'}>
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

/** One tense as its own column: name, then one line per person. */
function Column({ tense, highlight }: { tense: TenseBlock; highlight?: string }) {
  return (
    <section className="col">
      <h3 lang="fr">{tense.fr}</h3>
      {tense.rows.map((row, i) => (
        // Compound forms are built here, not looked up, so they are never the match.
        <Cell key={i} row={row} highlight={tense.compound ? undefined : highlight} />
      ))}
    </section>
  );
}

/**
 * A simple tense and its compound tense as two separate, equal-width columns.
 * The columns share row heights (CSS subgrid), so each person stays on one
 * line across both even when a form wraps.
 */
function Pair({ pair, highlight }: { pair: TensePair; highlight?: string }) {
  const { simple, compound } = pair;
  const style = { '--rows': simple.rows.length + 1 } as CSSProperties;
  return (
    <div className="pair" style={style}>
      <Column tense={simple} highlight={highlight} />
      {compound && <Column tense={compound} />}
    </div>
  );
}

function Mood({ mood, id, highlight }: { mood: MoodBlock; id: string; highlight?: string }) {
  return (
    <section className="mood" id={id}>
      <h2 lang="fr">{mood.fr}</h2>
      {mood.pairs.map((pair) => (
        <Pair key={pair.simple.fr} pair={pair} highlight={highlight} />
      ))}
    </section>
  );
}

export function ConjugationView({ table, idPrefix, highlight }: Props) {
  const c = useMemo(() => layoutConjugation(table), [table]);
  const sections = [
    ...c.moods.map((m) => ({ id: m.id, fr: m.fr })),
    ...(c.participles.length > 0 ? [{ id: 'participe', fr: 'Participe' }] : []),
  ];

  return (
    <article className="conjugation">
      <Headword lemma={c.lemma} lang="fr" pos={table.pos} />

      <JumpNav
        lang="fr"
        targets={sections.map((s) => ({ id: idPrefix + s.id, name: s.fr, short: SHORT_NAMES[s.id] ?? s.fr }))}
      />

      {c.moods.map((m) => (
        <Mood key={m.id} mood={m} id={idPrefix + m.id} highlight={highlight} />
      ))}

      {c.participles.length > 0 && (
        <section className="mood" id={`${idPrefix}participe`}>
          <h2 lang="fr">Participe</h2>
          <div className="pair" style={{ '--rows': 2 } as CSSProperties}>
            {c.participles.map((p) => (
              <section key={p.fr} className="col">
                <h3 lang="fr">{p.fr}</h3>
                <div className="cell" lang="fr">
                  <span
                    className={
                      highlight && [...p.forms, ...p.agreed].some((f) => matchesForm(f, highlight)) ? 'form hit' : 'form'
                    }
                  >
                    {p.forms.join(' / ')}
                  </span>
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
