import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel } from "@/components/campus/ui";
import { getAdminStudentsFn } from "@/lib/campus.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/students")({
  head: () => seo("Student Management", "Manage enrolled students."),
  loader: () => getAdminStudentsFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading students…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load students: {String(error)}</p>,
  component: PAdminStudents,
});

function PAdminStudents() {
  const { students, totalStudents } = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Records" title="Students" desc={`${totalStudents.toLocaleString()} registered students`} />
      <Panel className="overflow-x-auto p-0">
        {students.length === 0 ? <EmptyState title="No registered students" desc="Student accounts will appear here after registration." /> : (
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b text-left"><th className="eyebrow p-3">Student ID</th><th className="eyebrow p-3">Name</th><th className="eyebrow p-3">Email</th></tr></thead>
            <tbody>{students.map((student) => <tr key={student.studentId ?? student.email} className="border-b last:border-0"><td className="p-3">{student.studentId ?? "—"}</td><td className="p-3">{student.name}</td><td className="p-3">{student.email}</td></tr>)}</tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
