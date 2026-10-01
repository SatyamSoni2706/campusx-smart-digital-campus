import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import * as D from "@/data/mock";

export const Route = createFileRoute("/faculty/classes")({
  head: () => seo("Classes", "Courses you teach."),
  component: PFacultyClasses,
});

function PFacultyClasses() {
  return (
    <>
      <PageHeader eyebrow="Teaching" title="Classes" /><div className="grid gap-4 md:grid-cols-3">{D.facultyClasses.map((c) => (<Panel key={c.section}><span className="eyebrow">{c.code}</span><h3 className="font-bold">{c.name}</h3><p className="text-sm text-muted-foreground">{c.section} · {c.students} students</p><p className="mt-2 font-mono text-[11px]">{c.schedule}</p></Panel>))}</div>
    </>
  );
}
