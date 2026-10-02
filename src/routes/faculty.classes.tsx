import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel } from "@/components/campus/ui";
import { getFacultyFoundationFn } from "@/lib/campus.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faculty/classes")({
  head: () => seo("Classes", "Your assigned courses."),
  loader: () => getFacultyFoundationFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading courses…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load courses: {String(error)}</p>,
  component: PFacultyClasses,
});

function PFacultyClasses() {
  const { courses } = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Teaching" title="Classes" desc={`${courses.length} assigned active course${courses.length === 1 ? "" : "s"}`} />
      {courses.length === 0 ? <Panel><EmptyState title="No courses assigned" desc="Courses assigned to your faculty account will appear here." /></Panel> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => <Panel key={course.id}>
            <span className="eyebrow">{course.code}</span>
            <h3 className="font-bold">{course.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{course.section ? `Section ${course.section}` : "Section not set"}{course.semester ? ` · ${course.semester}` : ""}</p>
            <p className="mt-3 text-sm">{course.studentCount} enrolled student{course.studentCount === 1 ? "" : "s"}</p>
          </Panel>)}
        </div>
      )}
    </>
  );
}
