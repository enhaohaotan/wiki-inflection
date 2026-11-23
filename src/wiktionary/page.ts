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

const FORM_OF_SUFFIX = '-form-of';

/**
 * Grammar tags Wiktionary puts on an inflected form in a table, from a class
 * like "1|s|pres|indc-form-of" -> ["1", "s", "pres", "indc"]. Null if untagged.
 */
export function formOfTags(el: Element): string[] | null {
  for (const cls of Array.from(el.classList)) {
    if (cls !== 'form-of' && cls.endsWith(FORM_OF_SUFFIX)) {
      return cls.slice(0, -FORM_OF_SUFFIX.length).split('|');
    }
  }
  return null;
}

/** Text content with whitespace collapsed. */
export function cleanText(node: Node | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Words this entry says it is a form of, in page order, e.g. "vais" ->
 * ["aller"], "suis" -> ["être", "suivre"]. Read from the links of
 * "inflection of" / "alternative form of" style definitions in `lang`.
 * `inHeading` limits it to definitions under matching headings (e.g. Verb).
 */
export function formOfTargets(
  section: Element,
  lang: string,
  inHeading: (heading: string) => boolean = () => true,
): string[] {
  const targets: string[] = [];
  for (const link of Array.from(section.querySelectorAll(`.form-of-definition-link [lang="${lang}"] a`))) {
    if (!headingPath(link, section).some(inHeading)) continue;
    const title = link.getAttribute('title') || cleanText(link);
    if (title && !targets.includes(title)) targets.push(title);
  }
  return targets;
}
