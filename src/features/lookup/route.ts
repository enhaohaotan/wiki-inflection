import { useEffect, useState } from 'react';
import { defaultLanguage, getLanguage } from '../../languages/registry';

/**
 * The current lookup lives in the URL hash (#/fr/aller) so results can be
 * bookmarked and the back button works, without needing server rewrites.
 * An inflected form can name which dictionary form to show: #/fr/suis/suivre.
 */
export interface Route {
  lang: string;
  word: string;
  lemma?: string;
}

function decode(part: string | undefined): string {
  if (!part) return '';
  try {
    return decodeURIComponent(part).trim();
  } catch {
    return part.trim();
  }
}

function parseHash(hash: string): Route {
  const [, lang = '', word, lemma] = hash.replace(/^#/, '').split('/');
  return {
    lang: getLanguage(lang)?.code ?? defaultLanguage.code,
    word: decode(word),
    lemma: decode(lemma) || undefined,
  };
}

export function navigate(route: Route): void {
  const lemma = route.lemma ? `/${encodeURIComponent(route.lemma)}` : '';
  window.location.hash = route.word ? `/${route.lang}/${encodeURIComponent(route.word)}${lemma}` : '';
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
