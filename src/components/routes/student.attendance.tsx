import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Stat } from "@/components/campus/ui";
import { attendance } from "@/data/mock";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/attendance")({
  head: () => seo("Attendance", "Subject-wise attendance and shortage alerts."),
  component: AttendancePage,
});

function AttendancePage() {
  const at = attendance.reduce((s, a) => s + a.attended, 0);
  const tot = attendance.reduce((s, a) => s + a.total, 0);
  const pct = (at / tot) * 100;
  const low = attendance.filter((a) => a.attended / a.total < 0.8).length;
  return (
    <>
      <PageHeader eyebrow="Minimum required · 75%" title="Attendance" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Overall" value={`${pct.toFixed(1)}%`} tone="success" bar={pct} />
        <Stat label="Classes attended" value={`${at}/${tot}`} />
        <Stat label="Below 80%" value={low} hint="Needs attention" tone="warning" />
      </div>
      <Panel>
        <div className="flex flex-col divide-y">
          {attendance.map((a) => {
            const p = (a.attended / a.total) * 100;
            const tone = p >= 85 ? "bg-success" : p >= 75 ? "bg-warning" : "bg-danger";
            const need = Math.max(0, Math.ceil((0.75 * a.total - a.attended) / 0.25));
            return (
              <div key={a.code} className="grid items-center gap-2 py-4 md:grid-cols-[1fr_240px_80px]">
                <div><div className="font-semibold">{a.subject}</div><div className="font-mono text-[11px] text-muted-foreground">{a.code} · {a.attended}/{a.total} classes {need > 0 && `· attend next ${need}`}</div></div>
                <div className="h-2 overflow-hidden rounded-full bg-border"><div className={cn("h-full rounded-full", tone)} style={{ width: `${p}%` }} /></div>
                <div className="font-display text-lg font-bold md:text-right">{p.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </>
  );
}
