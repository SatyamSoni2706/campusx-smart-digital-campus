import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EventsBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { listEventsFn, setEventRegistrationFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/student/events")({
  head: () => seo("Events", "Campus events and registrations."),
  loader: () => listEventsFn(),
  component: StudentEvents,
});

function StudentEvents() {
  const items = Route.useLoaderData();
  const setRegistration = useServerFn(setEventRegistrationFn);
  return (
    <>
      <PageHeader eyebrow="What's on" title="Events" />
      <EventsBoard
        initialItems={items}
        onToggle={(eventId, registered) =>
          setRegistration({ data: { eventId, registered } })
        }
      />
    </>
  );
}
