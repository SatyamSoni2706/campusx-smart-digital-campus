import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo("About CampusX", "Why we built a unified digital campus."),
  component: PAbout,
});

function PAbout() {
  return (
    <PublicLayout><main className="mx-auto max-w-6xl px-5 pt-10">
      <PageHeader eyebrow="About" title="One campus. One platform." desc="CampusX connects students, faculty and administrators — replacing scattered notice boards, spreadsheets and WhatsApp groups with a single, reliable digital campus." />
    </main></PublicLayout>
  );
}
