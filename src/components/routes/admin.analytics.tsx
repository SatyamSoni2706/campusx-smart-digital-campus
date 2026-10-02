import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import * as D from "@/data/mock";

export const Route = createFileRoute("/admin/analytics")({
  head: () => seo("Analytics", "Campus analytics overview."),
  component: PAdminAnalytics,
});

function PAdminAnalytics() {
  return (
    <>
      <PageHeader eyebrow="Insights" title="Analytics" /><div className="grid grid-cols-2 gap-3 xl:grid-cols-3"><Stat label="Total students" value={D.analytics.totalStudents.toLocaleString()} /><Stat label="Total faculty" value={D.analytics.totalFaculty} /><Stat label="Active complaints" value={D.analytics.activeComplaints} tone="warning" hint="open" /><Stat label="Resolved complaints" value={D.analytics.resolvedComplaints} tone="success" hint="this term" /><Stat label="Upcoming events" value={D.analytics.upcomingEvents} /><Stat label="Avg resolution" value={D.analytics.avgResolutionDays + "d"} /></div><Panel className="mt-4"><h2 className="mb-4 text-lg font-bold">Issue categories</h2>{D.analytics.categories.map((c) => (<div key={c.name} className="mb-3"><div className="flex justify-between text-sm"><span>{c.name}</span><span className="font-mono">{c.value}</span></div><div className="mt-1 h-2 rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{ width: c.value + "%" }} /></div></div>))}</Panel>
    </>
  );
}
