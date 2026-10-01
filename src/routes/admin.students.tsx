import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import * as D from "@/data/mock";

export const Route = createFileRoute("/admin/students")({
  head: () => seo("Student Management", "Manage enrolled students."),
  component: PAdminStudents,
});

function PAdminStudents() {
  return (
    <>
      <PageHeader eyebrow="Records" title="Students" /><Panel className="overflow-x-auto p-0"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left"><th className="eyebrow p-3">Roll</th><th className="eyebrow p-3">Name</th><th className="eyebrow p-3">Dept</th><th className="eyebrow p-3">Year</th><th className="eyebrow p-3">Attendance</th><th className="eyebrow p-3">CGPA</th><th className="eyebrow p-3">Status</th></tr></thead><tbody>{D.students.map((x) => (<tr key={x.id} className="border-b last:border-0"><td className="p-3">{x.id}</td><td className="p-3">{x.name}</td><td className="p-3">{x.dept}</td><td className="p-3">{x.year}</td><td className="p-3">{x.attendance + '%'}</td><td className="p-3">{x.cgpa}</td><td className="p-3"><StatusBadge value={x.status} /></td></tr>))}</tbody></table></Panel>
    </>
  );
}
