import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Stat } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { getAdminDashboardFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/admin/analytics")({
  head: () => seo("Analytics", "Campus analytics overview."),
  loader: () => getAdminDashboardFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading analytics…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load analytics: {String(error)}</p>,
  component: PAdminAnalytics,
});

function PAdminAnalytics() {
  const data = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Insights" title="Analytics" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Total students" value={data.totalStudents.toLocaleString()} />
        <Stat label="Faculty" value={data.totalFaculty} hint={data.facultySource} />
        <Stat label="Total complaints" value={data.totalComplaints} />
        <Stat label="Active complaints" value={data.activeComplaints} tone="warning" hint="open" />
        <Stat label="Resolved complaints" value={data.resolvedComplaints} tone="success" />
        <Stat label="Notices" value={data.noticeCount} />
        <Stat label="Upcoming events" value={data.upcomingEvents} hint={`${data.totalEvents} total persisted events`} />
        <Stat label="Event registrations" value={data.totalEventRegistrations} hint="Active registrations from persisted records" />
        <Stat
          label="Avg resolution"
          value={data.avgResolutionDays === null ? "N/A" : `${data.avgResolutionDays}d`}
          hint={data.resolvedWithoutHistoryCount
            ? `${data.resolvedWithoutHistoryCount} resolved record(s) lack resolution history and are excluded`
            : "Based on resolved status history"}
        />
        <Stat label="Lost & Found items" value={data.totalLostFoundItems} hint={`${data.openLostFoundItems} open`} />
      </div>
      <Panel className="mt-4">
        <h2 className="mb-4 text-lg font-bold">Issue categories</h2>
        {data.complaintCategories.map((category) => (
          <div key={category.name} className="mb-3">
            <div className="flex justify-between text-sm">
              <span>{category.name}</span>
              <span className="font-mono">{category.value}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${data.totalComplaints ? (category.value / data.totalComplaints) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
        {data.complaintCategories.length === 0 && (
          <p className="text-sm text-muted-foreground">No complaints yet.</p>
        )}
      </Panel>
      <Panel className="mt-4">
        <h2 className="mb-4 text-lg font-bold">Complaint status</h2>
        {data.complaintStatusCounts.length === 0 ? <p className="text-sm text-muted-foreground">No complaint status data yet.</p> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{data.complaintStatusCounts.map((status) => <div key={status.name} className="rounded-lg border p-3"><div className="text-sm text-muted-foreground">{status.name}</div><div className="mt-1 text-xl font-bold">{status.value}</div></div>)}</div>
        )}
      </Panel>
      <Panel className="mt-4">
        <h2 className="mb-4 text-lg font-bold">Event registrations</h2>
        {data.eventRegistrationCounts.length === 0 ? <p className="text-sm text-muted-foreground">No persisted events yet.</p> : (
          <div className="space-y-2">{data.eventRegistrationCounts.map((event) => <div key={event.id} className="flex justify-between gap-4 border-b pb-2 text-sm last:border-0"><span>{event.title}</span><span className="font-mono">{event.registrations}</span></div>)}</div>
        )}
      </Panel>
    </>
  );
}
