import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import * as D from "@/data/mock";

export const Route = createFileRoute("/faculty/")({
  head: () => seo("Faculty Dashboard", "Your classes and tasks."),
  component: PFacultyIndex,
});

function PFacultyIndex() {
  return (
    <>
      <PageHeader eyebrow="Welcome back" title={D.currentFaculty.name} /><div className="grid grid-cols-2 gap-3 xl:grid-cols-3"><Stat label="Classes" value={D.facultyClasses.length} /><Stat label="Students" value={D.facultyClasses.reduce((s, c) => s + c.students, 0)} /><Stat label="Open issues" value={D.complaints.filter((c) => c.status !== "Resolved").length} tone="warning" hint="from students" /></div><Panel className="mt-4"><h2 className="mb-3 text-lg font-bold">My classes</h2>{D.facultyClasses.map((c) => (<div key={c.section} className="border-b py-2.5 last:border-0"><div className="font-semibold">{c.name} · {c.section}</div><div className="font-mono text-[11px] text-muted-foreground">{c.schedule} · {c.room}</div></div>))}</Panel>
    </>
  );
}
