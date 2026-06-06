import type { Metadata } from "next";
import { StubPage } from "@/components/ui/StubPage";
import { config } from "@/config";

export const metadata: Metadata = { title: `Feed — ${config.brand}` };

export default function FeedPage() {
  return (
    <StubPage
      title="Feed"
      blurb="The latest additions to the archive, newly dated labels and notes from the community — a running stream, coming soon."
    />
  );
}
