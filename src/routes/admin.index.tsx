import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { getAdminDashboardFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/admin/")({
  head: () => seo("Admin Dashboard", "University operations overview."),
  loader: () => getAdminDashboardFn(),
  component: PAdminIndex,
});

function PAdminIndex() {
  const data = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Overview" title="Admin dashboard" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Students" value={data.totalStudents.toLocaleString()} />
        <Stat label="Faculty" value={data.totalFaculty} />
        <Stat label="Total complaints" value={data.totalComplaints} />
        <Stat
          label="Active complaints"
          value={data.activeComplaints}
          tone="warning"
          hint="needs action"
        />
        <Stat label="Resolved complaints" value={data.resolvedComplaints} tone="success" />
        <Stat label="Notices" value={data.noticeCount} />
        <Stat label="Events" value={data.upcomingEvents} />
      </div>
      <Panel className="mt-4">
        <h2 className="mb-3 text-lg font-bold">Recent complaints</h2>
        {data.recentComplaints.map((c) => (
          <div key={c.id} className="flex items-center gap-3 border-b py-2.5 last:border-0">
            <span className="font-mono text-xs">{c.id}</span>
            <span className="flex-1 text-sm">{c.title}</span>
            <StatusBadge value={c.status} />
          </div>
        ))}
        <Link
          to="/admin/complaints"
          className="mt-3 inline-block text-sm font-semibold text-primary"
        >
          Manage complaints →
        </Link>
      </Panel>
    </>
  );
}
