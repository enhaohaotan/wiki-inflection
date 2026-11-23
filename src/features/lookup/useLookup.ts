import { useEffect, useState } from 'react';
import type { LanguageModule } from '../../languages/registry';
import { lookup, type LookupResult } from './lookup';

export type LookupState = { status: 'idle' } | { status: 'loading'; query: string } | LookupResult;

/**
 * Runs a lookup whenever the language, word or chosen dictionary form
 * changes; `attempt` forces a retry.
 */
export function useLookup(
  language: LanguageModule,
  word: string,
  lemma: string | undefined,
  attempt: number,
): LookupState {
  const [state, setState] = useState<LookupState>({ status: 'idle' });

  useEffect(() => {
    if (!word) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading', query: word });
    lookup(language, word, controller.signal, lemma)
      .then((result) => {
        if (!controller.signal.aborted) setState(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setState({ status: 'error', kind: 'http' });
      });
    return () => controller.abort();
  }, [language, word, lemma, attempt]);

  return state;
}
