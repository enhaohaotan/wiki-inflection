/**
 * Navigating the structure of a Wiktionary page, independent of language.
 *
 * Parsoid HTML wraps each heading and its content in a <section>, nested by
 * heading level:
 *
 *   <section><h2 id="French">French</h2>
 *     <section><h3>Verb</h3>
 *       <section><h4>Conjugation</h4> ... </section>
 */

export function parsePage(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

function headingOf(section: Element): Element | null {
  const first = section.firstElementChild;
  return first && /^H[1-6]$/.test(first.tagName) ? first : null;
}

function headingText(section: Element): string {
  return headingOf(section)?.textContent?.trim() ?? '';
}

function languageSections(doc: Document): Element[] {
  return Array.from(doc.querySelectorAll('section')).filter(
    (s) => headingOf(s)?.tagName === 'H2',
  );
}

/** Names of the languages that have an entry on this page, in page order. */
export function listLanguages(doc: Document): string[] {
  return languageSections(doc).map(headingText).filter(Boolean);
}

/** The top-level section for one language, e.g. "French". */
export function findLanguageSection(doc: Document, heading: string): Element | null {
  return languageSections(doc).find((s) => headingText(s) === heading) ?? null;
}

/**
 * Headings enclosing `el`, outermost first, up to but excluding `root`.
 * e.g. ["Etymology 2", "Verb", "Conjugation"].
 */
export function headingPath(el: Element, root: Element): string[] {
  const path: string[] = [];
  for (let cur = el.parentElement; cur && cur !== root; cur = cur.parentElement) {
    if (cur.tagName === 'SECTION') {
      const text = headingText(cur);
      if (text) path.unshift(text);
    }
  }
  return path;
}

/** Text content with whitespace collapsed. */
export function cleanText(node: Node | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}
