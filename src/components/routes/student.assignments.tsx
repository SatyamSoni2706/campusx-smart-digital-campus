import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FilterChips, PageHeader, StatusBadge, EmptyState } from "@/components/campus/ui";
import { btn } from "@/components/campus/features";
import { assignments as seed, fmtDate } from "@/data/mock";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/student/assignments")({
  head: () => seo("Assignments", "Track deadlines, submissions and grades."),
  component: AssignmentsPage,
});

const tabs = ["All", "Pending", "Submitted", "Graded", "Overdue"] as const;

function AssignmentsPage() {
  const [items, setItems] = useState(seed);
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const list = items.filter((a) => tab === "All" || a.status === tab);
  return (
    <>
      <PageHeader eyebrow="Coursework" title="Assignments" />
      <div className="mb-5"><FilterChips options={tabs} value={tab} onChange={setTab} /></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => (
          <div key={a.id} className="glass rise flex flex-col rounded-xl p-5">
            <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{a.code}</span><StatusBadge value={a.status} className="ml-auto" /></div>
            <h3 className="mt-2 font-bold">{a.title}</h3>
            <div className="text-sm text-muted-foreground">{a.subject} · {a.faculty}</div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-xs">Due {fmtDate(a.due)}</span>
              {a.marks && <span className="font-display font-bold text-success">{a.marks}</span>}
              {(a.status === "Pending" || a.status === "Overdue") && (
                <label className={btn + " cursor-pointer"}>Upload
                  <input type="file" className="hidden" onChange={() => { setItems((xs) => xs.map((x) => (x.id === a.id ? { ...x, status: "Submitted" } : x))); toast.success(`Submitted: ${a.title}`); }} />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <EmptyState title="Nothing here" desc="You're all caught up." />}
    </>
  );
}
