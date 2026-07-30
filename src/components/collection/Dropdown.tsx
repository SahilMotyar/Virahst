"use client";

/**
 * Small custom select used for the collection filters and sort. A button shows
 * the current choice; a listbox of options opens beneath it.
 *
 * Follows the APG listbox pattern: the options are the focusable elements (a
 * `role="option"` must not wrap a button — that hides the option from assistive
 * tech), Up/Down/Home/End move through them, Enter/Space picks one, Escape
 * closes and hands focus back to the trigger.
 */

import { useEffect, useId, useRef, useState } from "react";

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  /** Short label shown before the value, e.g. "Category". */
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}

export function Dropdown({ label, value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listId = useId();
  const currentIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const current = options[currentIndex] ?? options[0];
  // Which option has roving focus while the list is open.
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  // Move DOM focus to the active option whenever it changes while open.
  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const openWith = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openWith(currentIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openWith(options.length - 1);
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onChange(options[activeIndex].value);
        close();
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close(false) : openWith(currentIndex))}
        onKeyDown={onTriggerKey}
        className="flex min-h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition-colors hover:border-black/25"
      >
        <span className="text-ink-2">{label}</span>
        <span className="font-medium">{current.label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-ink-2 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          id={listId}
          onKeyDown={onListKey}
          className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-72 min-w-full overflow-auto rounded-2xl border border-black/5 bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,.05),0_12px_32px_rgba(0,0,0,.12)]"
        >
          {options.map((o, i) => {
            const active = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={active}
                tabIndex={i === activeIndex ? 0 : -1}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                onClick={() => {
                  onChange(o.value);
                  close();
                }}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-6 whitespace-nowrap rounded-xl px-3 text-left text-sm transition-colors ${
                  active
                    ? "bg-accent/10 font-medium text-accent-ink"
                    : "text-ink hover:bg-black/4"
                }`}
              >
                {o.label}
                {active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
