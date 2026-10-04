import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EmptyState, PageHeader, Panel, StatusBadge, inputCls } from "@/components/campus/ui";
import { createFacultyAssignmentFn, getFacultyAssignmentsFn, gradeFacultyAssignmentFn } from "@/lib/campus.functions";
import { seo } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/assignments")({
  head: () => seo("Faculty Assignments", "Create assignments and review submissions."),
  loader: () => getFacultyAssignmentsFn({ data: {} }),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading assignments…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load assignments: {String(error)}</p>,
  component: PFacultyAssignments,
});

function PFacultyAssignments() {
  const initial = Route.useLoaderData();
  const [data, setData] = useState(initial);
  const [courseId, setCourseId] = useState(initial.courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const createAssignment = useServerFn(createFacultyAssignmentFn);
  const loadAssignments = useServerFn(getFacultyAssignmentsFn);
  const gradeAssignment = useServerFn(gradeFacultyAssignmentFn);

  async function refresh(selectedId?: string) {
    const next = await loadAssignments({ data: { courseAssignmentId: selectedId } });
    setData(next);
    setMarks(Object.fromEntries(next.submissions.map((submission) => [submission.studentUserId, submission.marks ?? ""])));
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await createAssignment({ data: { courseId, title, description, due, maxMarks: Number(maxMarks) } });
      toast.success("Assignment created");
      setTitle(""); setDescription("");
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not create the assignment.";
      setError(message); toast.error(message);
    } finally { setBusy(false); }
  }

  async function selectAssignment(id: string) {
    setBusy(true); setError("");
    try { await refresh(id || undefined); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load submissions."); }
    finally { setBusy(false); }
  }

  async function saveGrade(studentUserId: string) {
    const assignment = data.selectedAssignment;
    if (!assignment) return;
    const value = marks[studentUserId];
    if (value === undefined || value.trim() === "" || !Number.isFinite(Number(value))) {
      setError("Enter a valid numeric mark before saving."); return;
    }
    setBusy(true); setError("");
    try {
      await gradeAssignment({ data: { courseAssignmentId: assignment.id, studentUserId, marks: Number(value) } });
      toast.success("Grade saved");
      await refresh(assignment.id);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save the grade.";
      setError(message); toast.error(message);
    } finally { setBusy(false); }
  }

  return <>
    <PageHeader eyebrow="Coursework" title="Assignments" desc="Create coursework for your assigned courses and review student submissions." />
    {error && <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
    {data.courses.length === 0 ? <Panel><EmptyState title="No courses assigned" desc="An admin must assign a course before you can create or review assignments." /></Panel> : <>
      <Panel className="mb-5">
        <h2 className="mb-4 font-bold">Create assignment</h2>
        <form onSubmit={(event) => void create(event)} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Course<select className={`${inputCls} mt-1`} value={courseId} onChange={(event) => setCourseId(event.target.value)} required>
            {data.courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}{course.section ? ` · ${course.section}` : ""}</option>)}
          </select></label>
          <label className="text-sm font-medium">Title<input className={`${inputCls} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={160} required /></label>
          <label className="text-sm font-medium">Due date<input type="date" className={`${inputCls} mt-1`} value={due} onChange={(event) => setDue(event.target.value)} required /></label>
          <label className="text-sm font-medium">Maximum marks<input type="number" className={`${inputCls} mt-1`} value={maxMarks} onChange={(event) => setMaxMarks(event.target.value)} min="0.01" max="1000000" step="any" required /></label>
          <label className="text-sm font-medium md:col-span-2">Description<textarea className={`${inputCls} mt-1 min-h-24`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} /></label>
          <div><button disabled={busy || !courseId} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Saving…" : "Create assignment"}</button></div>
        </form>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <Panel className="overflow-x-auto p-0">
          <div className="p-5 pb-0"><h2 className="font-bold">Course assignments</h2></div>
          {data.assignments.length === 0 ? <div className="p-5"><EmptyState title="No assignments yet" desc="Assignments you create for assigned courses will appear here." /></div> : <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b text-left"><th className="eyebrow p-3">Title</th><th className="eyebrow p-3">Course</th><th className="eyebrow p-3">Due</th><th className="eyebrow p-3">Submissions</th></tr></thead>
            <tbody>{data.assignments.map((assignment) => <tr key={assignment.id} className={`cursor-pointer border-b last:border-0 hover:bg-muted/40 ${data.selectedAssignment?.id === assignment.id ? "bg-muted/40" : ""}`} onClick={() => void selectAssignment(assignment.id)}>
              <td className="p-3 font-medium">{assignment.title}<span className="block text-xs text-muted-foreground">Max {assignment.maxMarks}</span></td>
              <td className="p-3">{assignment.code}</td><td className="p-3">{assignment.due}</td><td className="p-3">{assignment.submissionCount}/{assignment.totalStudents}</td>
            </tr>)}</tbody>
          </table>}
        </Panel>

        <Panel className="overflow-x-auto">
          {!data.selectedAssignment ? <EmptyState title="Select an assignment" desc="Choose an assignment to review its enrolled students and submissions." /> : <>
            <div className="mb-4"><div className="eyebrow">{data.selectedAssignment.code} · Due {data.selectedAssignment.due}</div><h2 className="text-lg font-bold">{data.selectedAssignment.title}</h2><p className="text-sm text-muted-foreground">Maximum {data.selectedAssignment.maxMarks} marks</p>{data.selectedAssignment.description && <p className="mt-2 whitespace-pre-wrap text-sm">{data.selectedAssignment.description}</p>}</div>
            {data.submissions.length === 0 ? <EmptyState title="No enrolled students" desc="Enroll students in this course to provide them with the assignment." /> : <div className="divide-y">
              {data.submissions.map((submission) => <div key={submission.studentAssignmentId} className="py-4">
                <div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><p className="font-medium">{submission.studentName}</p><p className="font-mono text-xs text-muted-foreground">{submission.studentId || submission.studentUserId}</p></div><StatusBadge value={submission.submittedAt ? submission.status : "Pending"} /></div>
                {submission.submittedAt ? <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
                  <p>{submission.filename} · {submission.mimeType || "Unknown type"} · {submission.fileSizeBytes} bytes</p>
                  {submission.marks !== null && <p className="font-semibold text-success">Grade: {submission.marks} / {submission.maxMarks}</p>}
                  <div className="mt-2 flex max-w-sm items-center gap-2"><input aria-label={`Marks for ${submission.studentName}`} type="number" min="0" max={submission.maxMarks} step="any" className={inputCls} value={marks[submission.studentUserId] ?? ""} onChange={(event) => setMarks((current) => ({ ...current, [submission.studentUserId]: event.target.value }))} placeholder={`0 – ${submission.maxMarks}`} /><button disabled={busy} onClick={() => void saveGrade(submission.studentUserId)} className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">Save grade</button></div>
                </div> : <p className="mt-2 text-xs text-muted-foreground">No submission received.</p>}
              </div>)}
            </div>}
          </>}
        </Panel>
      </div>
    </>}
  </>;
}
