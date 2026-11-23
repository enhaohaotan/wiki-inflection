import { useEffect, useState } from 'react';
import { addRecent, readRecent, type RecentItem } from './features/lookup/cache';
import { navigate, useRoute } from './features/lookup/route';
import { SearchBar } from './features/lookup/SearchBar';
import { useLookup, type LookupState } from './features/lookup/useLookup';
import { defaultLanguage, getLanguage } from './languages/registry';
import { entryViews } from './languages/views';
import { pageUrl } from './wiktionary/client';

const EXAMPLES = ['aller', 'être', 'avoir', 'faire', 'prendre', 'finir'];

export function App() {
  const route = useRoute();
  const language = getLanguage(route.lang) ?? defaultLanguage;
  const [attempt, setAttempt] = useState(0);
  const state = useLookup(language, route.word, attempt);
  const [recent, setRecent] = useState<RecentItem[]>(readRecent);

  const search = (word: string) => navigate({ lang: language.code, word });

  useEffect(() => {
    document.title = route.word ? `${route.word} – Conjugaison` : 'Conjugaison';
  }, [route.word]);

  useEffect(() => {
    if (state.status === 'ok') {
      setRecent(addRecent({ lang: state.entry.lang, word: state.entry.title }));
      window.scrollTo(0, 0);
    }
  }, [state]);

  const View = entryViews[language.code];

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <SearchBar
            value={route.word}
            inputLang={language.code}
            onSearch={search}
          />
        </div>
      </header>

      <main>
        {state.status === 'idle' && (
          <Home recent={recent.filter((r) => r.lang === language.code)} onPick={search} />
        )}
        {state.status === 'loading' && (
          <p className="status" role="status">
            Looking up <b>{state.query}</b>…
          </p>
        )}
        {state.status === 'ok' && View && <View entry={state.entry} />}
        <Problem state={state} languageName={language.name} onRetry={() => setAttempt((n) => n + 1)} />
      </main>

      <footer className="credits">
        {state.status === 'ok' ? (
          <>
            From{' '}
            <a href={pageUrl(state.entry.title)} target="_blank" rel="noreferrer">
              “{state.entry.title}” on Wiktionary
            </a>
            ,{' '}
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

function Home({ recent, onPick }: { recent: RecentItem[]; onPick(word: string): void }) {
  const words = recent.length > 0 ? recent.map((r) => r.word) : EXAMPLES;
  return (
    <section className="home">
      <h2>{recent.length > 0 ? 'Recent' : 'Examples'}</h2>
      <ul className="words">
        {words.map((word) => (
          <li key={word}>
            <button type="button" lang="fr" onClick={() => onPick(word)}>
              {word}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Problem({
  state,
  languageName,
  onRetry,
}: {
  state: LookupState;
  languageName: string;
  onRetry(): void;
}) {
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
          <h2>“{state.query}” is not a {languageName} word</h2>
          {state.available.length > 0 && (
            <p>
              Wiktionary lists it under: {state.available.slice(0, 6).join(', ')}
              {state.available.length > 6 && '…'}
            </p>
          )}
        </div>
      );
    case 'no-inflection':
      return (
        <div className="status problem" role="alert">
          <h2>No conjugation for “{state.query}”</h2>
          <p>
            It has a {languageName} entry, but not as a verb in its dictionary form. Enter the
            infinitive, e.g. <i>aller</i> rather than <i>vais</i>.
          </p>
          <p>
            <a href={pageUrl(state.query)} target="_blank" rel="noreferrer">
              Open on Wiktionary
            </a>
          </p>
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
                ? `Wiktionary asked us to slow down${
                    state.retryAfter ? ` — try again in ${state.retryAfter} seconds` : ''
                  }.`
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
