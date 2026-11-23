import type React from 'react';

export interface JumpTarget {
  /** Element id of the section, without the leading '#'. */
  id: string;
  /** Full name, used as tooltip and for screen readers. */
  name: string;
  /** What is shown in the bar, e.g. "Ind." for Indicatif. */
  short: string;
}

/** Sticky bar of links to the sections of an entry (IND. COND. ... / PASS. PART.). */
export function JumpNav({ targets, lang }: { targets: JumpTarget[]; lang: string }) {
  if (targets.length === 0) return null;
  return (
    <nav className="jump" aria-label="Sections">
      {targets.map((t) => (
        <a
          key={t.id}
          href={`#${t.id}`}
          onClick={(e) => jumpTo(e, t.id)}
          lang={lang}
          title={t.name}
          aria-label={t.name}
        >
          {t.short}
        </a>
      ))}
    </nav>
  );
}

/** Scrolls to a section without touching the URL hash, which holds the current word. */
function jumpTo(e: React.MouseEvent, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
