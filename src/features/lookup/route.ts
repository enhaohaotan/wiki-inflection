import { useEffect, useState } from 'react';
import { defaultLanguage, getLanguage } from '../../languages/registry';

/**
 * The current lookup lives in the URL hash (#/fr/aller) so results can be
 * bookmarked and the back button works, without needing server rewrites.
 */
export interface Route {
  lang: string;
  word: string;
}

function parseHash(hash: string): Route {
  const [, lang = '', ...rest] = hash.replace(/^#/, '').split('/');
  let word = rest.join('/');
  try {
    word = decodeURIComponent(word);
  } catch {
    /* keep the raw text */
  }
  return { lang: getLanguage(lang)?.code ?? defaultLanguage.code, word: word.trim() };
}

export function navigate(route: Route): void {
  window.location.hash = route.word ? `/${route.lang}/${encodeURIComponent(route.word)}` : '';
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
