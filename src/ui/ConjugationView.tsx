import type { CSSProperties } from 'react';
import type {
  ConjugationLayout,
  ConjugationMood,
  ConjugationRow,
  ConjugationTense,
  FormMatcher,
} from '../languages/conjugation';
import { Words } from './FormTable';
import { Headword } from './Headword';
import { JumpNav } from './JumpNav';

/**
 * A verb's conjugation on the lookup site, the same for every language: it
 * shows the shared layout each language makes of its table
 * (languages/conjugation.ts), every tense open.
 */

interface Props {
  layout: ConjugationLayout;
  lang: string;
  /** Prefix for element ids, so several tables can share a page. */
  idPrefix: string;
  /** Inflected form to highlight, from a reverse lookup. */
  highlight?: string;
  matches: FormMatcher;
}

/**
 * "je" + "vais" -> "je vais"; "j’" + "ai" -> "j’ai". With several forms the
 * subject is repeated only where it changes: "il a passé / est passé(e)",
 * "j’ai passé / je suis passé(e)".
 */
function Cell({ row, lang, hit }: { row: ConjugationRow; lang: string; hit: (form: string) => boolean }) {
  if (row.shown.length === 0) {
    return (
      <div className="cell missing" lang={lang}>
        <span className="pron">{row.label}</span> —
      </div>
    );
  }
  const subjects = row.subjects ?? [];
  return (
    <div className="cell" lang={lang}>
      {row.shown.map((form, i) => {
        const subject = subjects[i] ?? row.label;
        const repeated = i > 0 && subject === (subjects[i - 1] ?? row.label);
        return (
          <span key={i} className="part">
            {i > 0 && <span className="or"> / </span>}
            {!repeated && (
              <>
                <span className="pron">{subject}</span>
                {/['’]$/.test(subject) ? '' : ' '}
              </>
            )}
            <span className={hit(form) ? 'form hit' : 'form'}>
              <Words text={form} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** One tense as its own column: name, then one line per person. */
function Column({ tense, lang, hit }: { tense: ConjugationTense; lang: string; hit: (form: string) => boolean }) {
  // Built forms are made here, not looked up, so they are never the match.
  const hitHere = tense.compound ? () => false : hit;
  return (
    <section className="col">
      <h3 lang={lang}>{tense.name}</h3>
      {tense.rows.map((row, i) => (
        <Cell key={i} row={row} lang={lang} hit={hitHere} />
      ))}
    </section>
  );
}

/** "présent" -> "Présent": a single form's label as a column heading. */
const heading = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

/** Single forms (participles, gerund): each its own column, with its name above. */
function Forms({ tense, lang, hit }: { tense: ConjugationTense; lang: string; hit: (form: string) => boolean }) {
  return (
    <div className="pair" style={{ '--rows': 2 } as CSSProperties}>
      {tense.rows
        .filter((row) => row.shown.length > 0)
        .map((row) => (
          <section key={row.label} className="col">
            <h3 lang={lang}>{heading(row.label)}</h3>
            <div className="cell" lang={lang}>
              {/* Agreed forms (allée) are found too, under the one shown (allé). */}
              <span className={[...row.shown, ...row.accepted].some(hit) ? 'form hit' : 'form'}>
                {row.shown.join(' / ')}
              </span>
            </div>
          </section>
        ))}
    </div>
  );
}

/**
 * Tenses side by side as equal-width columns that share row heights (CSS
 * subgrid), so each person stays on one line across them even when a form
 * wraps.
 */
function Mood({ mood, id, lang, hit }: { mood: ConjugationMood; id: string; lang: string; hit: (form: string) => boolean }) {
  return (
    <section className="mood" id={id}>
      <h2 lang={lang}>{mood.name}</h2>
      {mood.pairs.map((pair) => {
        const [first] = pair;
        if (!first) return null;
        // Single forms carry no subjects.
        if (first.rows.every((row) => row.subjects === undefined)) {
          return <Forms key={first.name} tense={first} lang={lang} hit={hit} />;
        }
        return (
          <div key={first.name} className="pair" style={{ '--rows': first.rows.length + 1 } as CSSProperties}>
            {pair.map((tense) => (
              <Column key={tense.name} tense={tense} lang={lang} hit={hit} />
            ))}
          </div>
        );
      })}
    </section>
  );
}

export function ConjugationView({ layout, lang, idPrefix, highlight, matches }: Props) {
  const hit = (form: string) => !!highlight && matches(form, highlight);
  return (
    <article className="conjugation">
      <Headword lemma={layout.lemma} lang={lang} pos={layout.pos} />
      <JumpNav
        lang={lang}
        targets={layout.moods.map((m) => ({ id: idPrefix + m.id, name: m.name, short: m.short }))}
      />
      {layout.moods.map((m) => (
        <Mood key={m.id} mood={m} id={idPrefix + m.id} lang={lang} hit={hit} />
      ))}
    </article>
  );
}
