import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import * as D from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/attendance")({
  head: () => seo("Attendance Management", "Mark class attendance."),
  component: PFacultyAttendance,
});

function PFacultyAttendance() {
  return (
    <>
      <PageHeader eyebrow="CS301 · CSE-5B" title="Mark attendance" /><Panel>{D.students.map((s) => (<label key={s.id} className="flex items-center gap-3 border-b py-2.5 last:border-0"><input type="checkbox" defaultChecked className="size-4" /><span className="font-mono text-xs">{s.id}</span><span className="flex-1 text-sm">{s.name}</span><span className="font-mono text-xs text-muted-foreground">{s.attendance}%</span></label>))}<button onClick={() => toast.success("Attendance saved")} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save attendance</button></Panel>
    </>
  );
}
