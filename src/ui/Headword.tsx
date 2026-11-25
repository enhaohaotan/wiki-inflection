/** Part-of-speech names in each language, as shown next to the headword. */
const POS_LABELS: Record<string, Record<string, string>> = {
  fr: { verb: 'verbe' },
  da: { verb: 'verbum', noun: 'substantiv', adjective: 'adjektiv', adverb: 'adverbium', pronoun: 'pronomen', numeral: 'talord' },
};

/**
 * The big headword, with its part of speech on the right: "spise ... VERBUM".
 * `label` replaces the part of speech, e.g. for a table of several words.
 */
export function Headword({
  lemma,
  lang,
  pos,
  label: override,
}: {
  lemma: string;
  lang: string;
  pos: string;
  label?: string;
}) {
  const label = override ?? POS_LABELS[lang]?.[pos];
  return (
    <header className="lemma">
      <h1 lang={lang}>{lemma}</h1>
      {label && (
        <span className="pos" lang={lang}>
          {label}
        </span>
      )}
    </header>
  );
}
