import type { Metadata } from "next";
import { StubPage } from "@/components/ui/StubPage";
import { config } from "@/config";

export const metadata: Metadata = { title: `Community — ${config.brand}` };

export default function CommunityPage() {
  return (
    <StubPage
      title="Community"
      blurb="Where collectors swap finds, date a label, and submit packs of their own. The community space is being built."
    />
  );
}
