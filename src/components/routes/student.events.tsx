import { createFileRoute } from "@tanstack/react-router";
import { EventsBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/student/events")({
  head: () => seo("Events", "Campus events and registrations."),
  component: StudentEvents,
});

function StudentEvents() {
  return (
    <>
      <PageHeader eyebrow="What's on" title="Events" />
      <EventsBoard />
    </>
  );
}
