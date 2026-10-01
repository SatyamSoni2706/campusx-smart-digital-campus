import { createFileRoute } from "@tanstack/react-router";
import { LostFoundView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/lost-found")({
  head: () => seo("Lost & Found Desk", "Oversee lost and found reports."),
  component: AdminLostFound,
});

function AdminLostFound() {
  return (
    <>
      <PageHeader eyebrow="Operations" title="Lost & Found" />
      <LostFoundView admin />
    </>
  );
}
