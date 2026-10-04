import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel, Stat } from "@/components/campus/ui";
import { getFacultyFoundationFn } from "@/lib/campus.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faculty/")({
  head: () => seo("Faculty Dashboard", "Your assigned courses and academic activity."),
  loader: () => getFacultyFoundationFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading faculty dashboard…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load faculty dashboard: {String(error)}</p>,
  component: PFacultyIndex,
});

function PFacultyIndex() {
  const data = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Welcome back" title={data.identity.name} desc={data.identity.email} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Stat label="Assigned courses" value={data.totalCourses} />
        <Stat label="Enrolled students" value={data.totalStudents} />
        <Stat label="Course assignments" value={data.assignmentCount} />
        <Stat label="Assigned issues" value={data.assignedIssueCount} />
        <Stat label="Open assigned issues" value={data.openAssignedIssueCount} />
      </div>
      <div className="mt-3 text-right"><Link to="/faculty/issues" className="text-sm font-semibold text-primary">Review assigned issues →</Link></div>
      <Panel className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">My courses</h2><Link to="/faculty/classes" className="text-sm font-semibold text-primary">View all</Link></div>
        {data.courses.length === 0 ? <EmptyState title="No courses assigned" desc="Ask an administrator to create courses and assign them to your faculty account." /> : (
          <div className="divide-y">{data.courses.slice(0, 5).map((course) => <Link key={course.id} to="/faculty/classes/$courseId" params={{ courseId: course.id }} className="flex flex-wrap items-center justify-between gap-2 py-3 outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary"><div><div className="font-semibold">{course.name}</div><div className="font-mono text-[11px] text-muted-foreground">{course.code}{course.section ? ` · ${course.section}` : ""}{course.semester ? ` · ${course.semester}` : ""}</div></div><span className="text-sm text-muted-foreground">{course.studentCount} enrolled</span></Link>)}</div>
        )}
      </Panel>
    </>
  );
}
