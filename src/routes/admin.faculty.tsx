import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel } from "@/components/campus/ui";
import { getAdminFacultyFn } from "@/lib/campus.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/faculty")({
  head: () => seo("Faculty Management", "Manage registered faculty accounts."),
  loader: () => getAdminFacultyFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading faculty…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load faculty: {String(error)}</p>,
  component: PAdminFaculty,
});

function PAdminFaculty() {
  const { faculty } = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Registered accounts" title="Faculty" desc="Faculty records come from users with the Faculty role. Department, designation, and course data are not stored in the current schema." />
      <Panel className="overflow-x-auto p-0">
        {faculty.length === 0 ? <EmptyState title="No registered faculty" desc="Faculty accounts will appear here when available." /> : (
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b text-left"><th className="eyebrow p-3">Name</th><th className="eyebrow p-3">Email</th></tr></thead>
            <tbody>{faculty.map((member) => <tr key={member.email} className="border-b last:border-0"><td className="p-3">{member.name}</td><td className="p-3">{member.email}</td></tr>)}</tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
