import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import * as D from "@/data/mock";

export const Route = createFileRoute("/admin/faculty")({
  head: () => seo("Faculty Management", "Manage faculty members."),
  component: PAdminFaculty,
});

function PAdminFaculty() {
  return (
    <>
      <PageHeader eyebrow="Records" title="Faculty" /><Panel className="overflow-x-auto p-0"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left"><th className="eyebrow p-3">ID</th><th className="eyebrow p-3">Name</th><th className="eyebrow p-3">Dept</th><th className="eyebrow p-3">Designation</th><th className="eyebrow p-3">Courses</th><th className="eyebrow p-3">Email</th></tr></thead><tbody>{D.faculty.map((x) => (<tr key={x.id} className="border-b last:border-0"><td className="p-3">{x.id}</td><td className="p-3">{x.name}</td><td className="p-3">{x.dept}</td><td className="p-3">{x.designation}</td><td className="p-3">{x.courses}</td><td className="p-3">{x.email}</td></tr>))}</tbody></table></Panel>
    </>
  );
}
