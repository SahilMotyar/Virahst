"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself (which the
 * route-level error.tsx cannot catch). Replaces the entire document, so it must
 * render its own <html>/<body> and can't depend on the app stylesheet — hence
 * the inline styles. Most app errors are caught by error.tsx; this only shows
 * for the rarer layout-level failure.
 */

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#faf6ef",
          color: "#1a1208",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
          Something slipped
        </h1>
        <p style={{ maxWidth: 360, fontSize: 14, lineHeight: 1.6, opacity: 0.7 }}>
          The page hit a hiccup while loading. Trying again usually sorts it out.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            border: "none",
            borderRadius: 999,
            background: "#1a1208",
            color: "#faf6ef",
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
