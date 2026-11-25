import { useEffect, useState, type ReactNode } from 'react';
import { Headword } from '../../../ui/Headword';
import { NumeralTotal } from '../numeral/NumeralView';
import { PersonalTable } from '../pronoun/PronounView';
import { loadDanishReference, type DanishReference } from '../reference';

/** The Danish home page: links to the table of personal pronouns and the table of numerals. */
export function DanishHome() {
  return (
    <nav className="tables">
      <a href="#/da/@stedord" lang="da">
        Personlige stedord
      </a>
      <a href="#/da/@talord" lang="da">
        Talord
      </a>
    </nav>
  );
}

/** Loads the reference tables and shows one of them once they are there. */
function ReferencePage({ children }: { children(reference: DanishReference): ReactNode }) {
  const [reference, setReference] = useState<DanishReference | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    loadDanishReference().then(
      (r) => live && setReference(r),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, []);

  if (failed) return <p className="status">Could not load the table from Wiktionary.</p>;
  if (!reference) return <p className="status" role="status">Loading…</p>;
  return <>{children(reference)}</>;
}

/** All personal pronouns, nothing marked. */
export function DanishPronounPage() {
  return <ReferencePage>{(r) => <PersonalTable rows={r.personal} />}</ReferencePage>;
}

/** All numerals, nothing marked. */
export function DanishNumeralPage() {
  return (
    <ReferencePage>
      {(r) => (
        <article className="conjugation">
          <Headword lemma="talord" lang="da" pos="numeral" label="" />
          <NumeralTotal groups={r.numerals} apart={false} />
        </article>
      )}
    </ReferencePage>
  );
}
