import { createFileRoute } from "@tanstack/react-router";
import { WeeklyTimetable, TodaySchedule } from "@/components/campus/features";
import { Panel, PanelHeader, PageHeader } from "@/components/campus/ui";
import { todayKey } from "@/data/mock";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/student/timetable")({
  head: () => seo("Timetable", "Your weekly class timetable."),
  component: StudentTimetable,
});

function StudentTimetable() {
  return (
    <>
      <PageHeader eyebrow="Semester 5 · CSE-B" title="Weekly timetable" />
      <Panel className="mb-6"><PanelHeader title="Today's schedule" meta={todayKey()} /><TodaySchedule /></Panel>
      <WeeklyTimetable />
    </>
  );
}
