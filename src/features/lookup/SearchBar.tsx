import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LanguagePicker, type LanguageOption } from './LanguagePicker';

interface Props {
  value: string;
  inputLang: string;
  /** With more than one, a language picker shows beside the box. */
  languages?: readonly LanguageOption[];
  onSearch(word: string): void;
  onLanguageChange?(code: string): void;
  placeholder?: string;
}

export function SearchBar({
  value,
  inputLang,
  languages = [],
  onSearch,
  onLanguageChange,
  placeholder = 'Look up inflections',
}: Props) {
  const [text, setText] = useState(value);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => setText(value), [value]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const word = text.trim();
    if (!word) return;
    onSearch(word);
    // Dismiss the on-screen keyboard so the result is visible.
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <form className="search" role="search" onSubmit={submit}>
      {languages.length > 1 && onLanguageChange && (
        <LanguagePicker value={inputLang} languages={languages} onChange={onLanguageChange} />
      )}
      <div className="field">
        <input
          ref={input}
          type="search"
          name="q"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label="Word to look up"
          lang={inputLang}
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
        />
        {/* Own clear button: the browser's built-in one looks different on every platform. */}
        {text && (
          <button
            type="button"
            className="clear"
            aria-label="Clear"
            onClick={() => {
              setText('');
              input.current?.focus();
            }}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <button type="submit">Search</button>
    </form>
  );
}
