import type { Metadata } from "next";
import { Inter, Mukta } from "next/font/google";
import "./globals.css";
import { config } from "@/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Devanagari display face for the hero title and item names.
const mukta = Mukta({
  variable: "--font-display-devanagari",
  weight: ["400", "600", "700"],
  subsets: ["devanagari", "latin"],
});

export const metadata: Metadata = {
  title: `${config.brand} — ${config.heroSubtitle}`,
  description: config.tagline,
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
      className={`${inter.variable} ${mukta.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
