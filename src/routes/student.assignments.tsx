import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { FilterChips, PageHeader, StatusBadge, EmptyState } from "@/components/campus/ui";
import { btn } from "@/components/campus/features";
import { fmtDate } from "@/data/mock";
import { seo } from "@/lib/seo";
import { getStudentAssignmentsFn, submitAssignmentFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/student/assignments")({
  head: () => seo("Assignments", "Track deadlines, submissions and grades."),
  loader: () => getStudentAssignmentsFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading assignments…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load assignments: {String(error)}</p>,
  component: AssignmentsPage,
});

const tabs = ["All", "Pending", "Submitted", "Graded", "Overdue"] as const;

function AssignmentsPage() {
  const initialItems = Route.useLoaderData();
  const [items, setItems] = useState<(typeof initialItems)[number][]>(initialItems);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const submitAssignment = useServerFn(submitAssignmentFn);
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const list = items.filter((a) => tab === "All" || a.status === tab);

  async function submitFile(assignmentId: string, file: File, input: HTMLInputElement) {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Choose a file smaller than 25 MB.");
      input.value = "";
      return;
    }
    setSubmittingId(assignmentId);
    try {
      const updated = await submitAssignment({
        data: {
          assignmentId,
          filename: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
        },
      });
      setItems((current) => current.map((item) => (item.id === assignmentId ? { ...item, ...updated } : item)));
      toast.success("Submission record saved. File contents are not stored.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the submission record.");
      input.value = "";
    } finally {
      setSubmittingId(null);
    }
  }

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
              {a.marks && <span className="font-display font-bold text-success">{a.marks}{a.maxMarks !== null ? ` / ${a.maxMarks}` : ""}</span>}
              {a.submittedFilename && <span className="text-xs text-muted-foreground">Record saved · {a.submittedFilename}</span>}
              {(a.status === "Pending" || a.status === "Overdue") && (
                <label className={btn + " cursor-pointer"}>{submittingId === a.id ? "Saving…" : "Upload"}
                  <input type="file" className="hidden" disabled={submittingId === a.id} onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) void submitFile(a.id, file, event.currentTarget);
                  }} />
                </label>
              )}
            </div>
            {a.submissionStorageState === "MetadataOnly" && <div className="mt-2 text-xs text-muted-foreground">Submission record saved; file contents are not stored.</div>}
          </div>
        ))}
      </div>
      {list.length === 0 && (items.length === 0
        ? <EmptyState title="No assignments yet" desc="Assignments for your account will appear here." />
        : <EmptyState title="Nothing here" desc="You're all caught up." />)}
    </>
  );
}
