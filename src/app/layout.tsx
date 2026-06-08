import type { Metadata } from "next";
import { Inter, Mukta, Modak } from "next/font/google";
import "./globals.css";
import { config } from "@/config";
import { TopNav } from "@/components/nav/TopNav";
import { MusicBar } from "@/components/music/MusicBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Devanagari display face for item names and general display use.
const mukta = Mukta({
  variable: "--font-display-devanagari",
  weight: ["400", "600", "700"],
  subsets: ["devanagari", "latin"],
});

// Characterful rounded Devanagari face for the hero wordmark. Swap this single
// import (e.g. Rozha_One, Yatra_One, Baloo_2) to restyle the title.
const modak = Modak({
  variable: "--font-hero-devanagari",
  weight: "400",
  subsets: ["devanagari", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: `${config.brand} — ${config.heroSubtitle}`,
  description: config.tagline,
  openGraph: {
    title: `${config.brand} — ${config.heroSubtitle}`,
    description: config.tagline,
    type: "website",
  },
  // Tells Chrome's auto-translate to leave the DOM alone. Google Translate
  // rewrites text nodes (wrapping them in <font> tags) after hydration; React
  // then can't find the nodes it owns and crashes the whole app with
  // insertBefore/removeChild errors on the next commit (e.g. a click). The
  // matching translate="no" on <body> covers other translation engines.
  other: { google: "notranslate" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Browser extensions (e.g. Dark Reader) inject attributes on <html>
      // before React hydrates; this stops the spurious mismatch warning.
      suppressHydrationWarning
      className={`${inter.variable} ${mukta.variable} ${modak.variable} h-full antialiased`}
    >
      {/* translate="no" app-wide: external page translators (and some
          extensions) inject/wrap DOM nodes that React owns. On the next commit
          React fails to find them and throws insertBefore/removeChild, which —
          with no error boundary — crashed the whole page. Keeping the whole
          tree out of translation prevents the crash at the source. */}
      <body className="min-h-full" translate="no">
        <TopNav />
        {children}
        <MusicBar />
      </body>
    </html>
  );
}
