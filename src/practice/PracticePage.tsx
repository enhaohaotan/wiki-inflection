import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { SearchBar } from '../features/lookup/SearchBar';
import { Headword } from '../ui/Headword';
import { JumpNav } from '../ui/JumpNav';
import { pageUrl } from '../wiktionary/client';
import { practiceLookup, type PracticeResult } from './practiceLookup';
import { plainVerb } from './pronominal';
import { savedTable } from './savedTables';
import { buildSheet, isCorrect, type Blank, type Exercise, type Sheet } from './sheet';
import { KEY_VERBS, PRACTICE_VERBS, randomVerb } from './verbs';
import { verbWeight } from './weights';

/**
 * Conjugation practice: type a French verb, fill in its forms tense by
 * tense, then check what you filled in or compare with the answers.
 * Tables come from the same lookup (and the same cache) as the viewer.
 * The verb lives in the hash (verbs.html#aller, served as /verbs#aller) so it can be bookmarked.
 */

function readHash(): string {
  const raw = window.location.hash.replace(/^#\/?/, '');
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

type PracticeState = { status: 'idle' } | { status: 'loading'; query: string } | PracticeResult;

/** Looks `word` up whenever it changes; `attempt` forces a retry. */
function usePracticeLookup(word: string, attempt: number): PracticeState {
  const [state, setState] = useState<PracticeState>({ status: 'idle' });
  useEffect(() => {
    if (!word) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading', query: word });
    practiceLookup(word, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setState(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setState({ status: 'error', kind: 'http' });
      });
    return () => controller.abort();
  }, [word, attempt]);
  return state;
}

function useHashWord(): string {
  const [word, setWord] = useState(readHash);
  useEffect(() => {
    const onChange = () => setWord(readHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return word;
}

const SHORT_NAMES: Record<string, string> = {
  indicatif: 'Ind.',
  conditionnel: 'Cond.',
  subjonctif: 'Subj.',
  imperatif: 'Impér.',
  participe: 'Part.',
};

export function PracticePage() {
  const word = useHashWord();
  const [attempt, setAttempt] = useState(0);
  // Verbs on the practice list come with the page and work offline; any
  // other verb is looked up on Wiktionary.
  const saved = useMemo(() => savedTable(word), [word]);
  const state = usePracticeLookup(saved ? '' : word, attempt);
  const table = saved ?? (state.status === 'ok' ? state.table : undefined);
  const sheet = useMemo(() => (table ? buildSheet(table) : undefined), [table]);
  // The Wiktionary page the table comes from. A pronominal verb is credited
  // to its plain verb (se lever -> lever), whose page its table is built from.
  const source = saved ? plainVerb(saved.lemma) : state.status === 'ok' ? state.page : undefined;

  useEffect(() => {
    document.title = word ? `${word} – Conjugation Practice` : 'Conjugation Practice';
    // A verb picked lower down the home page opens at its top.
    window.scrollTo(0, 0);
  }, [word]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="home" href="#" title="All verbs">
            Home
          </a>
          <SearchBar
            value={word}
            inputLang="fr"
            languages={[]}
            placeholder="Verb to practise"
            onSearch={(w) => (window.location.hash = encodeURIComponent(w))}
            onLanguageChange={() => {}}
          />
          <button
            type="button"
            className="random"
            title="Random verb"
            onClick={() => (window.location.hash = encodeURIComponent(randomVerb(word, Math.random, verbWeight)))}
          >
            Random
          </button>
        </div>
      </header>

      <main>
        {!word && <Home />}
        {state.status === 'loading' && (
          <p className="status" role="status">
            Looking up <b>{state.query}</b>…
          </p>
        )}
        {/* A new table starts a fresh sheet. */}
        {sheet && <Drill key={sheet.lemma} sheet={sheet} />}
        <Problem state={state} onRetry={() => setAttempt((n) => n + 1)} />
      </main>

      <footer className="credits">
        {source ? (
          <>
            From{' '}
            <a href={pageUrl(source)} target="_blank" rel="noreferrer">
              “{source}”
            </a>{' '}
            on Wiktionary,{' '}
          </>
        ) : (
          <>Data from Wiktionary, </>
        )}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">
          CC BY-SA 4.0
        </a>
      </footer>
    </>
  );
}

/** The home page: every verb on the practice list, each opening its exercises. */
function Home() {
  return (
    <nav className="verb-list" aria-label="Verbs to practise" lang="fr">
      {/* Numbered: the key verbs first, set off by a heavy rule, then the rest in dictionary order. */}
      {[...KEY_VERBS, ...PRACTICE_VERBS.filter((v) => !KEY_VERBS.includes(v))].map((verb, i) => (
        <a key={verb} href={`#${encodeURIComponent(verb)}`} className={i === KEY_VERBS.length - 1 ? 'last-key' : undefined}>
          <span className="num">{String(i + 1).padStart(3, '0')}</span>
          {verb}
        </a>
      ))}
    </nav>
  );
}

function Drill({ sheet }: { sheet: Sheet }) {
  const root = useRef<HTMLElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  /** Right or wrong, for the blanks that were filled in at the last check and not edited since. */
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const blanks = useMemo(
    () => sheet.sections.flatMap((s) => s.pairs.flat().flatMap((e) => e.blanks)).filter((b) => b.forms.length > 0),
    [sheet],
  );

  const check = () => {
    const next: Record<string, boolean> = {};
    for (const blank of blanks) {
      const value = values[blank.id]?.trim();
      if (value) next[blank.id] = isCorrect(value, blank);
    }
    setResults(next);
    setChecked(true);
  };

  const change = (id: string, value: string) => {
    setValues((v) => ({ ...v, [id]: value }));
    // An edited answer is no longer the one that was checked.
    setResults((r) => {
      if (!(id in r)) return r;
      const { [id]: _, ...rest } = r;
      return rest;
    });
  };

  // Enter moves on to the next blank.
  const next = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const inputs = Array.from(root.current?.querySelectorAll<HTMLTextAreaElement>('.blank') ?? []);
    inputs[inputs.indexOf(e.currentTarget) + 1]?.focus();
  };

  const marked = Object.values(results);
  const right = marked.filter(Boolean).length;

  return (
    <article className="conjugation drill" ref={root}>
      <Headword lemma={sheet.lemma} lang="fr" pos={sheet.pos} />
      <JumpNav
        lang="fr"
        targets={sheet.sections.map((s) => ({ id: `p-${s.id}`, name: s.fr, short: SHORT_NAMES[s.id] ?? s.fr }))}
      />

      {sheet.sections.map((section) => (
        <section key={section.id} className="mood" id={`p-${section.id}`}>
          <h2 lang="fr">{section.fr}</h2>
          {section.pairs.map((pair) => (
            <div key={pair[0]!.fr} className="drill-pair">
              {pair.map((exercise) => (
                <ExerciseBlock
                  key={exercise.fr}
                  exercise={exercise}
                  values={values}
                  results={results}
                  showAnswers={showAnswers}
                  onChange={change}
                  onKeyDown={next}
                />
              ))}
            </div>
          ))}
        </section>
      ))}

      <div className="drill-actions">
        <p className="drill-score" role="status">
          {checked && (marked.length === 0 ? 'Nothing filled in to check' : `${right} of ${marked.length} right`)}
        </p>
        <button type="button" onClick={check}>
          Check
        </button>
        {/* Both labels take up space, so the button keeps one width and Check stays put. */}
        <button
          type="button"
          className="toggle"
          aria-pressed={showAnswers}
          aria-label="Show answers"
          onClick={() => setShowAnswers((s) => !s)}
        >
          <span className={showAnswers ? 'hidden' : undefined}>Show answers</span>
          <span className={showAnswers ? undefined : 'hidden'}>Hide answers</span>
        </button>
      </div>
    </article>
  );
}

function ExerciseBlock({
  exercise,
  values,
  results,
  showAnswers,
  onChange,
  onKeyDown,
}: {
  exercise: Exercise;
  values: Record<string, string>;
  results: Record<string, boolean>;
  showAnswers: boolean;
  onChange(id: string, value: string): void;
  onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void;
}) {
  // Compound and literary tenses start folded. Answers typed in a folded tense are kept.
  const [open, setOpen] = useState(!exercise.folded);
  return (
    <section className="drill-tense">
      <h3 lang="fr">
        {exercise.folded ? (
          <button type="button" className="fold" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {exercise.fr}
            <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        ) : (
          exercise.fr
        )}
      </h3>
      {open &&
        exercise.blanks.map((blank) => (
          <BlankRow
            key={blank.id}
            blank={blank}
            tense={exercise.fr}
            value={values[blank.id] ?? ''}
            result={results[blank.id]}
            showAnswer={showAnswers}
            onChange={onChange}
            onKeyDown={onKeyDown}
          />
        ))}
    </section>
  );
}

function BlankRow({
  blank,
  tense,
  value,
  result,
  showAnswer,
  onChange,
  onKeyDown,
}: {
  blank: Blank;
  tense: string;
  value: string;
  result: boolean | undefined;
  showAnswer: boolean;
  onChange(id: string, value: string): void;
  onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void;
}) {
  const state = result === undefined ? '' : result ? ' right' : ' wrong';
  const answer = blank.forms.join(' / ');
  return (
    <div className="drill-row">
      <span className="pron" lang="fr">
        {blank.label}
      </span>
      {blank.forms.length === 0 ? (
        <span className="missing">—</span>
      ) : (
        <span className="drill-field">
          <span className={`blank-wrap${state}`}>
            {/* A one-line text area rather than an input: iOS offers to fill
                in a contact ("AutoFill Contact") on a column of inputs,
                whatever autoComplete says, but not on a text area. */}
            <textarea
              className="blank"
              rows={1}
              wrap="off"
              lang="fr"
              value={value}
              // A pasted line break would make it two lines.
              onChange={(e) => onChange(blank.id, e.target.value.replace(/[\r\n]+/g, ' '))}
              onKeyDown={onKeyDown}
              aria-label={`${tense}, ${blank.label}`}
              aria-invalid={result === false || undefined}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="next"
              // Keep what is typed clear of the answer shown at the right end
              // (the answer is set at 3/4 the size of the input's text).
              style={showAnswer ? { paddingRight: `calc(${answer.length * 0.75}ch + 26px)` } : undefined}
            />
            {/* Drawn over the right end of the line, so showing it moves nothing. */}
            <span className="blank-side">
              {showAnswer && (
                <span className="answer" lang="fr">
                  {answer}
                </span>
              )}
              {result !== undefined && (
                <span className="mark" aria-label={result ? 'right' : 'wrong'}>
                  {result ? '✓' : '✗'}
                </span>
              )}
            </span>
          </span>
        </span>
      )}
    </div>
  );
}

function Problem({ state, onRetry }: { state: PracticeState; onRetry(): void }) {
  switch (state.status) {
    case 'not-found':
      return (
        <div className="status problem" role="alert">
          <h2>No entry for “{state.query}”</h2>
          <p>Check the spelling, including accents (é, è, ê, ç).</p>
        </div>
      );
    case 'no-language':
      return (
        <div className="status problem" role="alert">
          <h2>“{state.query}” is not a French word</h2>
        </div>
      );
    case 'no-inflection':
      return (
        <div className="status problem" role="alert">
          <h2>No conjugation for “{state.query}”</h2>
          <p>It has a French entry, but Wiktionary gives no conjugation table for it.</p>
        </div>
      );
    case 'error':
      return (
        <div className="status problem" role="alert">
          <h2>
            {state.kind === 'network'
              ? 'You appear to be offline'
              : state.kind === 'rate-limited'
                ? 'Too many requests'
                : 'Wiktionary returned an error'}
          </h2>
          <p>
            {state.kind === 'network'
              ? 'Verbs you have already looked up still work.'
              : state.kind === 'rate-limited'
                ? `Wiktionary asked us to slow down${state.retryAfter ? ` — try again in ${state.retryAfter} seconds` : ''}.`
                : 'Please try again in a moment.'}
          </p>
          <button type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      );
    default:
      return null;
  }
}
