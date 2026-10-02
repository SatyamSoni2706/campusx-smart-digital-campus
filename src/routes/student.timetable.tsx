import { createFileRoute } from "@tanstack/react-router";
import { WeeklyTimetable, TodaySchedule } from "@/components/campus/features";
import { EmptyState, Panel, PanelHeader, PageHeader } from "@/components/campus/ui";
import { todayKey } from "@/data/mock";
import { seo } from "@/lib/seo";
import { getTimetableFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/student/timetable")({
  head: () => seo("Timetable", "Your weekly class timetable."),
  loader: () => getTimetableFn(),
  component: StudentTimetable,
});

function StudentTimetable() {
  const items = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Your classes" title="Weekly timetable" />
      {items.length === 0 ? (
        <EmptyState title="No timetable records yet" desc="Your timetable will appear here when records are available." />
      ) : (
        <>
      <Panel className="mb-6">
        <PanelHeader title="Today's schedule" meta={todayKey() ?? "No classes today"} />
        <TodaySchedule items={items} />
      </Panel>
      <WeeklyTimetable items={items} />
        </>
      )}
    </>
  );
}
