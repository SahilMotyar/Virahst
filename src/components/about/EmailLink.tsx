"use client";

/**
 * A mailto link assembled in the browser from its two halves, so the full
 * address never appears in the server-rendered HTML that spam bots scrape.
 * Until hydration the anchor has no href; it becomes a real link right after.
 */

import { useSyncExternalStore } from "react";

// Hydration-safe "has mounted" flag (false on the server, true on the client).
const subscribe = () => () => {};

export function EmailLink({
  user,
  domain,
  subject,
  className,
  children,
}: {
  user: string;
  domain: string;
  subject?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  const href = mounted ? `mailto:${user}@${domain}${query}` : undefined;

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
