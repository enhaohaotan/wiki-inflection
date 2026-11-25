import { useEffect, useState } from 'react';
import { writeLastLanguage } from './features/lookup/cache';
import { navigate, useRoute } from './features/lookup/route';
import { SearchBar } from './features/lookup/SearchBar';
import { useLookup, type LookupState } from './features/lookup/useLookup';
import { defaultLanguage, getLanguage, languages, type LanguageModule } from './languages/registry';
import { homeViews } from './languages/homes';
import { entryViews } from './languages/views';
import { pageUrl } from './wiktionary/client';

export function App() {
  const route = useRoute();
  const language = getLanguage(route.lang) ?? defaultLanguage;
  const [attempt, setAttempt] = useState(0);
  const home = homeViews[language.code];
  // A page of the home page (#/da/@talord) rather than a word to look up.
  const Page = home?.pages[route.word];
  const state = useLookup(language, Page ? '' : route.word, route.lemma, attempt);

  const search = (word: string) => navigate({ lang: language.code, word });
  // Switching language looks the current word up again in the new language.
  const switchLanguage = (code: string) => navigate({ lang: code, word: Page ? '' : route.word });

  useEffect(() => writeLastLanguage(language.code), [language.code]);

  useEffect(() => {
    const word = Page ? '' : route.word;
    document.title = word ? `${word} – Wiki Inflection` : 'Wiki Inflection';
  }, [route.word, Page]);

  useEffect(() => {
    if (state.status === 'ok') window.scrollTo(0, 0);
  }, [state]);

  const View = entryViews[language.code];

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <SearchBar
            value={Page ? '' : route.word}
            inputLang={language.code}
            languages={languages}
            onSearch={search}
            onLanguageChange={switchLanguage}
          />
        </div>
      </header>

      <main>
        {Page ? <Page /> : state.status === 'idle' && home && <home.Home />}
        {state.status === 'loading' && (
          <p className="status" role="status">
            Looking up <b>{state.query}</b>…
          </p>
        )}
        {state.status === 'ok' && View && (
          <View
            entries={state.match?.entries ?? [state.entry]}
            initial={state.entry}
            highlight={state.match?.form}
          />
        )}
        <Problem
          state={state}
          language={language}
          onRetry={() => setAttempt((n) => n + 1)}
          onSwitch={switchLanguage}
        />
      </main>

      <footer className="credits">
        {home && route.word && (
          <p>
            <a href={`#/${language.code}`}>
              {home.link}
            </a>
          </p>
        )}
        {state.status === 'ok' ? (
          <>
            From{' '}
            {(state.match?.entries ?? [state.entry]).map((entry, i) => (
              <span key={entry.title}>
                {i > 0 && ', '}
                <a href={pageUrl(entry.title)} target="_blank" rel="noreferrer">
                  “{entry.title}”
                </a>
              </span>
            ))}{' '}
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

function Problem({
  state,
  language,
  onRetry,
  onSwitch,
}: {
  state: LookupState;
  language: LanguageModule;
  onRetry(): void;
  onSwitch(code: string): void;
}) {
  const languageName = language.name;
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
          {languages
            .filter((l) => l.code !== language.code && state.available.includes(l.heading))
            .map((l) => (
              <p key={l.code}>
                <button type="button" onClick={() => onSwitch(l.code)}>
                  Look up in {l.name}
                </button>
              </p>
            ))}
        </div>
      );
    case 'no-inflection':
      return (
        <div className="status problem" role="alert">
          <h2>No table for “{state.query}”</h2>
          <p>
            It has a {languageName} entry, but Wiktionary lists no inflected forms for it, or for a word
            it is a form of.
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
