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
  title: `${config.brand} — ${config.heroSubtitle}`,
  description: config.tagline,
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  /** Parallel route slot for the intercepted item modal. */
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Browser extensions (e.g. Dark Reader) inject attributes on <html>
      // before React hydrates; this stops the spurious mismatch warning.
      suppressHydrationWarning
      className={`${inter.variable} ${mukta.variable} ${modak.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TopNav />
        {children}
        {modal}
        <MusicBar />
      </body>
    </html>
  );
}
