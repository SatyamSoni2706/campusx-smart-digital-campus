import { createFileRoute } from "@tanstack/react-router";
import { EventsBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/events")({
  head: () => seo("Manage Events", "Create and monitor campus events."),
  component: AdminEvents,
});

function AdminEvents() {
  return (
    <>
      <PageHeader eyebrow="Engagement" title="Events" />
      <EventsBoard manage />
    </>
  );
}
