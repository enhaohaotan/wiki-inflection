import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { LanguagePicker } from '../features/lookup/LanguagePicker';
import { SearchBar } from '../features/lookup/SearchBar';
import { Headword } from '../ui/Headword';
import { JumpNav } from '../ui/JumpNav';
import { pageUrl } from '../wiktionary/client';
import { isCorrect } from './answers';
import { getPracticeLanguage, PRACTICE_LANGUAGES } from './languages';
import { randomVerb, verbWeights } from './random';
import { homeHref, usePracticeRoute, verbHref } from './route';
import type { Blank, Exercise, PracticeLanguage, PracticeResult, Sheet } from './types';

/**
 * Conjugation practice: pick or type a verb, fill in its forms tense by
 * tense, then check what you filled in or compare with the answers. Each
 * language (./languages.ts) brings its verb list, its saved tables and how
 * to turn a table into exercises; this page is the same for all of them.
 * The address holds the language and the verb: verbs.html#/fr/aller, served
 * as /verbs#/fr/aller.
 */

/** The picker lists each language in its own name: Français, Deutsch. */
const PICKER_LANGUAGES = PRACTICE_LANGUAGES.map((l) => ({ code: l.code, name: l.ownName }));

type PracticeState = { status: 'idle' } | { status: 'loading'; query: string } | PracticeResult;

/** Looks `word` up whenever it changes; `attempt` forces a retry. */
function usePracticeLookup(language: PracticeLanguage, word: string, attempt: number): PracticeState {
  const [state, setState] = useState<PracticeState>({ status: 'idle' });
  useEffect(() => {
    if (!word) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading', query: word });
    language
      .lookup(word, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setState(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setState({ status: 'error', kind: 'http' });
      });
    return () => controller.abort();
  }, [language, word, attempt]);
  return state;
}

export function PracticePage() {
  const { language, word } = usePracticeRoute();
  const [attempt, setAttempt] = useState(0);
  // Verbs on the practice list come with the page and work offline; any
  // other verb is looked up on Wiktionary.
  const saved = useMemo(() => language.savedTable(word), [language, word]);
  // A language without verbs is not ready yet: its pages stay empty.
  const ready = language.verbs.length > 0;
  const state = usePracticeLookup(language, saved || !ready ? '' : word, attempt);
  const table = saved ?? (state.status === 'ok' ? state.table : undefined);
  const sheet = useMemo(() => (table ? language.buildSheet(table) : undefined), [language, table]);
  // The Wiktionary page the table comes from.
  const source = saved ? language.sourcePage(saved) : state.status === 'ok' ? state.page : undefined;
  const weight = useMemo(() => verbWeights(language), [language]);

  useEffect(() => {
    document.title = word ? `${word} – Conjugation Practice` : 'Conjugation Practice';
    // A verb picked lower down the home page opens at its top.
    window.scrollTo(0, 0);
  }, [language, word]);

  return (
    <>
      <header className="topbar">
        <div className="flag" aria-hidden="true" style={{ background: stripes(language.flag) }} />
        <div className="topbar-inner">
          {/* On the home page, where Home would lead nowhere, the language picker takes its place. */}
          {!word && PRACTICE_LANGUAGES.length > 1 ? (
            <LanguagePicker
              value={language.code}
              languages={PICKER_LANGUAGES}
              onChange={(code) => (window.location.hash = homeHref(getPracticeLanguage(code)!))}
            />
          ) : (
            <a className="home" href={homeHref(language)} title="All verbs">
              Home
            </a>
          )}
          <SearchBar
            value={word}
            inputLang={language.code}
            placeholder={language.placeholder}
            onSearch={(w) => (window.location.hash = verbHref(language, w))}
          />
          {ready && (
            <button
              type="button"
              className="random"
              title="Random verb"
              onClick={() =>
                (window.location.hash = verbHref(language, randomVerb(language.verbs, word, Math.random, weight)))
              }
            >
              Random
            </button>
          )}
        </div>
      </header>

      <main>
        {!word && ready && <Home language={language} />}
        {state.status === 'loading' && (
          <p className="status" role="status">
            Looking up <b>{state.query}</b>…
          </p>
        )}
        {/* A new table starts a fresh sheet. */}
        {sheet && <Drill key={`${language.code}:${sheet.lemma}`} sheet={sheet} language={language} />}
        <Problem state={state} language={language} onRetry={() => setAttempt((n) => n + 1)} />
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

/** The home page: every verb on the language's practice list, each opening its exercises. */
/** Hard-edged bands of equal width, left to right. */
function stripes(colors: readonly string[]): string {
  const width = 100 / colors.length;
  const bands = colors.map((c, i) => `${c} ${i * width}% ${(i + 1) * width}%`);
  return `linear-gradient(to right, ${bands.join(', ')})`;
}

function Home({ language }: { language: PracticeLanguage }) {
  const { keyVerbs, verbs } = language;
  return (
    <nav className="verb-list" aria-label="Verbs to practise" lang={language.code}>
      {/* Numbered: the key verbs first, set off by a heavy rule, then the rest in dictionary order. */}
      {[...keyVerbs, ...verbs.filter((v) => !keyVerbs.includes(v))].map((verb, i) => (
        <a key={verb} href={verbHref(language, verb)} className={i === keyVerbs.length - 1 ? 'last-key' : undefined}>
          <span className="num">{String(i + 1).padStart(3, '0')}</span>
          {verb}
        </a>
      ))}
    </nav>
  );
}

function Drill({ sheet, language }: { sheet: Sheet; language: PracticeLanguage }) {
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
      if (value) next[blank.id] = isCorrect(value, blank, language.locale);
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
      <Headword lemma={sheet.lemma} lang={language.code} pos={sheet.pos} />
      <JumpNav
        lang={language.code}
        targets={sheet.sections.map((s) => ({ id: `p-${s.id}`, name: s.name, short: s.short }))}
      />

      {sheet.sections.map((section) => (
        <section key={section.id} className="mood" id={`p-${section.id}`}>
          <h2 lang={language.code}>{section.name}</h2>
          {section.pairs.map((pair) => (
            <div key={pair[0]!.name} className="drill-pair">
              {pair.map((exercise) => (
                <ExerciseBlock
                  key={exercise.name}
                  lang={language.code}
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
        <button type="button" className="primary" onClick={check}>
          Check
        </button>
      </div>
    </article>
  );
}

function ExerciseBlock({
  lang,
  exercise,
  values,
  results,
  showAnswers,
  onChange,
  onKeyDown,
}: {
  lang: string;
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
      <h3 lang={lang}>
        {exercise.folded ? (
          <button type="button" className="fold" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {exercise.name}
            <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        ) : (
          exercise.name
        )}
      </h3>
      {open &&
        exercise.blanks.map((blank) => (
          <BlankRow
            key={blank.id}
            lang={lang}
            blank={blank}
            tense={exercise.name}
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
  lang,
  blank,
  tense,
  value,
  result,
  showAnswer,
  onChange,
  onKeyDown,
}: {
  lang: string;
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
      <span className="pron" lang={lang}>
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
              lang={lang}
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
                <span className="answer" lang={lang}>
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

function Problem({
  state,
  language,
  onRetry,
}: {
  state: PracticeState;
  language: PracticeLanguage;
  onRetry(): void;
}) {
  switch (state.status) {
    case 'not-found':
      return (
        <div className="status problem" role="alert">
          <h2>No entry for “{state.query}”</h2>
          <p>{language.spellingHint}</p>
        </div>
      );
    case 'no-language':
      return (
        <div className="status problem" role="alert">
          <h2>
            “{state.query}” is not a {language.name} word
          </h2>
        </div>
      );
    case 'no-inflection':
      return (
        <div className="status problem" role="alert">
          <h2>No conjugation for “{state.query}”</h2>
          <p>It has a {language.name} entry, but Wiktionary gives no conjugation table for it.</p>
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
