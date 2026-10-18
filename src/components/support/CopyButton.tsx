"use client";

/**
 * Copies a value (the UPI ID) to the clipboard and confirms in place for two
 * seconds. The label change is announced via aria-live.
 */

import { useEffect, useRef, useState } from "react";

const CONFIRM_MS = 2000;

function fallbackCopy(text: string) {
  // navigator.clipboard needs a secure context (fails over plain http, e.g.
  // testing on a phone over the LAN), so fall back to a hidden textarea.
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

export function CopyButton({
  text,
  srLabel,
  className = "",
}: {
  text: string;
  /** Extra screen-reader context, e.g. "UPI ID" → "Copy UPI ID". */
  srLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      fallbackCopy(text);
    }
    setCopied(true);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), CONFIRM_MS);
  }

  return (
    <button type="button" onClick={copy} aria-live="polite" className={className}>
      {copied ? (
        "Copied ✓"
      ) : (
        <>
          Copy{srLabel && <span className="sr-only"> {srLabel}</span>}
        </>
      )}
    </button>
  );
}
