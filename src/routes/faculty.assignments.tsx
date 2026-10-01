import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import * as D from "@/data/mock";

export const Route = createFileRoute("/faculty/assignments")({
  head: () => seo("Faculty Assignments", "Track submissions."),
  component: PFacultyAssignments,
});

function PFacultyAssignments() {
  return (
    <>
      <PageHeader eyebrow="Coursework" title="Assignments" /><Panel className="overflow-x-auto p-0"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left"><th className="eyebrow p-3">Title</th><th className="eyebrow p-3">Subject</th><th className="eyebrow p-3">Due</th><th className="eyebrow p-3">Submissions</th></tr></thead><tbody>{D.assignments.map((x) => (<tr key={x.id} className="border-b last:border-0"><td className="p-3">{x.title}</td><td className="p-3">{x.subject}</td><td className="p-3">{D.fmtDate(x.due)}</td><td className="p-3">{`${x.submissions}/${x.total}`}</td></tr>))}</tbody></table></Panel>
    </>
  );
}
