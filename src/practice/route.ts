import { useEffect, useState } from 'react';
import { defaultPracticeLanguage, getPracticeLanguage } from './languages';
import type { PracticeLanguage } from './types';

/**
 * The language and verb live in the hash, like the viewer's: #/fr/aller,
 * and #/fr for a language's home page, so they can be bookmarked and the
 * back button works. Anything else opens the default language's home page.
 */
export interface PracticeRoute {
  language: PracticeLanguage;
  /** '' on the home page. */
  word: string;
}

function decode(part: string): string {
  try {
    return decodeURIComponent(part).trim();
  } catch {
    return part.trim();
  }
}

export function parseHash(hash: string): PracticeRoute {
  const [, code = '', word = ''] = hash.replace(/^#/, '').split('/');
  const language = getPracticeLanguage(code);
  return language ? { language, word: decode(word) } : { language: defaultPracticeLanguage, word: '' };
}

export function homeHref(language: PracticeLanguage): string {
  return `#/${language.code}`;
}

export function verbHref(language: PracticeLanguage, verb: string): string {
  return `#/${language.code}/${encodeURIComponent(verb)}`;
}

export function usePracticeRoute(): PracticeRoute {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
