import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export interface LanguageOption {
  code: string;
  name: string;
}

interface Props {
  value: string;
  languages: readonly LanguageOption[];
  onChange(code: string): void;
}

/**
 * "FR ▾" button that opens a small list of languages. Built by hand rather
 * than with a native <select> so it matches the page on every platform.
 * Keyboard: Enter/Space/ArrowDown opens, arrows move, Enter picks, Escape closes.
 */
export function LanguagePicker({ value, languages, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const current = Math.max(
    0,
    languages.findIndex((l) => l.code === value),
  );

  const openList = () => {
    setActive(current);
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const pick = (code: string) => {
    close(true);
    if (code !== value) onChange(code);
  };

  // Focus the list when it opens so the arrow keys work straight away.
  useEffect(() => {
    if (open) list.current?.focus();
  }, [open]);

  // Close on a tap or click anywhere else.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openList();
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(languages.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(languages.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const option = languages[active];
      if (option) pick(option.code);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      close(true);
    }
  };

  return (
    <div className="lang-picker" ref={root}>
      <button
        ref={button}
        type="button"
        className="lang-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Language: ${languages[current]?.name ?? value}`}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onButtonKey}
      >
        {value.toUpperCase()}
        <svg viewBox="0 0 10 6" width="8" height="5" aria-hidden="true" className={open ? 'flip' : undefined}>
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          id={listId}
          className="lang-list"
          role="listbox"
          tabIndex={-1}
          aria-label="Language"
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
        >
          {languages.map((l, i) => (
            <li
              key={l.code}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={l.code === value}
              className={i === active ? 'active' : undefined}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(l.code)}
            >
              <span className="lang-code">{l.code.toUpperCase()}</span>
              <span className="lang-name">{l.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
