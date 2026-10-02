import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Stat } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { getAdminDashboardFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/admin/analytics")({
  head: () => seo("Analytics", "Campus analytics overview."),
  loader: () => getAdminDashboardFn(),
  component: PAdminAnalytics,
});

function PAdminAnalytics() {
  const data = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Insights" title="Analytics" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Total students" value={data.totalStudents.toLocaleString()} />
        <Stat label="Total faculty" value={data.totalFaculty} />
        <Stat label="Total complaints" value={data.totalComplaints} />
        <Stat label="Active complaints" value={data.activeComplaints} tone="warning" hint="open" />
        <Stat label="Resolved complaints" value={data.resolvedComplaints} tone="success" />
        <Stat label="Notices" value={data.noticeCount} />
        <Stat label="Upcoming events" value={data.upcomingEvents} />
        <Stat label="Avg resolution" value={`${data.avgResolutionDays}d`} />
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
    </>
  );
}
