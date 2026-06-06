import type { Metadata } from "next";
import { StubPage } from "@/components/ui/StubPage";
import { config } from "@/config";

export const metadata: Metadata = { title: `Categories — ${config.brand}` };

export default function CategoriesPage() {
  return (
    <StubPage
      title="Categories"
      blurb="Browse the archive grouped by kind — packaging, matchbox labels, film posters, signboards and more. This view is on its way."
    />
  );
}
