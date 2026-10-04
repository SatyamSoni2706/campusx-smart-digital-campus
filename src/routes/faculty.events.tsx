import { createFileRoute } from "@tanstack/react-router";
import { EventsBoard } from "@/components/campus/features";
import { EmptyState, PageHeader, Panel } from "@/components/campus/ui";
import { listEventsFn } from "@/lib/campus.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faculty/events")({
  head: () => seo("Faculty Events", "View campus events."),
  loader: () => listEventsFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading events…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load events: {String(error)}</p>,
  component: FacultyEvents,
});

function FacultyEvents() {
  const items = Route.useLoaderData();
  return <>
    <PageHeader eyebrow="Campus calendar" title="Events" desc="View published campus events and registration totals." />
    {items.length === 0 ? <Panel><EmptyState title="No events yet" desc="Published campus events will appear here." /></Panel> : <EventsBoard readOnly initialItems={items} />}
  </>;
}
