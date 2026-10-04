import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EventsBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { createEventFn, listEventsFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/admin/events")({
  head: () => seo("Manage Events", "Create and monitor campus events."),
  loader: () => listEventsFn(),
  component: AdminEvents,
});

function AdminEvents() {
  const items = Route.useLoaderData();
  const createEvent = useServerFn(createEventFn);
  return (
    <>
      <PageHeader eyebrow="Engagement" title="Events" />
      <EventsBoard manage initialItems={items} onCreate={(data) => createEvent({ data })} />
    </>
  );
}
