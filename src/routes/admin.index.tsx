import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import * as D from "@/data/mock";

export const Route = createFileRoute("/admin/")({
  head: () => seo("Admin Dashboard", "University operations overview."),
  component: PAdminIndex,
});

function PAdminIndex() {
  return (
    <>
      <PageHeader eyebrow="Overview" title="Admin dashboard" /><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Stat label="Students" value={D.analytics.totalStudents.toLocaleString()} /><Stat label="Faculty" value={D.analytics.totalFaculty} /><Stat label="Active complaints" value={D.analytics.activeComplaints} tone="warning" hint="needs action" /><Stat label="Events" value={D.analytics.upcomingEvents} /></div><Panel className="mt-4"><h2 className="mb-3 text-lg font-bold">Recent complaints</h2>{D.complaints.slice(0, 5).map((c) => (<div key={c.id} className="flex items-center gap-3 border-b py-2.5 last:border-0"><span className="font-mono text-xs">{c.id}</span><span className="flex-1 text-sm">{c.title}</span><StatusBadge value={c.status} /></div>))}<Link to="/admin/complaints" className="mt-3 inline-block text-sm font-semibold text-primary">Manage complaints →</Link></Panel>
    </>
  );
}
