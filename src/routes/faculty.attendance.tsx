import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel, inputCls } from "@/components/campus/ui";
import { getFacultyAttendanceDataFn, saveFacultyAttendanceFn } from "@/lib/campus.functions";
import { seo } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/attendance")({
  head: () => seo("Attendance Management", "Mark class attendance."),
  loader: () => getFacultyAttendanceDataFn({ data: {} }),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading attendance…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load attendance: {String(error)}</p>,
  component: PFacultyAttendance,
});

function PFacultyAttendance() {
  const initial = Route.useLoaderData();
  const [data, setData] = useState(initial);
  const [courseId, setCourseId] = useState(initial.selectedCourseId ?? "");
  const [sessionId, setSessionId] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [marks, setMarks] = useState<Record<string, "Present" | "Absent">>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async (nextCourseId: string, nextSessionId = "") => {
    setLoading(true); setError("");
    try {
      const result = await getFacultyAttendanceDataFn({ data: { courseId: nextCourseId || undefined, sessionId: nextSessionId || undefined } });
      setData(result); setCourseId(nextCourseId); setSessionId(nextSessionId);
      setMarks(Object.fromEntries(result.students.map((student) => {
        const old = result.selectedSession?.records.find((record) => record.studentUserId === student.userId);
        return [student.userId, old?.status];
      }).filter(([, status]) => status) as [string, "Present" | "Absent"][]));
      if (result.selectedSession) {
        setSessionDate(result.selectedSession.sessionDate);
        setStartTime(result.selectedSession.startTime ?? ""); setEndTime(result.selectedSession.endTime ?? "");
      } else {
        setSessionDate(new Date().toISOString().slice(0, 10)); setStartTime(""); setEndTime("");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load attendance."); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (data.students.length === 0) return;
    if (data.students.some((student) => !marks[student.userId])) { setError("Mark each enrolled student Present or Absent before saving."); return; }
    setSaving(true); setError("");
    try {
      const result = await saveFacultyAttendanceFn({ data: {
        courseId, sessionId: sessionId || undefined, sessionDate, startTime, endTime,
        records: data.students.map((student) => ({ studentUserId: student.userId, status: marks[student.userId] })),
      } });
      toast.success(result.created ? "Attendance session saved" : "Attendance updated");
      await load(courseId, result.sessionId);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save attendance.";
      setError(message); toast.error(message);
    } finally { setSaving(false); }
  };

  return <>
    <PageHeader eyebrow="Teaching" title="Attendance" desc="Record attendance for students enrolled in your assigned courses." />
    {data.courses.length === 0 ? <Panel><EmptyState title="No courses assigned" desc="An admin must assign a course before you can take attendance." /></Panel> : <>
      <Panel className="mb-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium">Course<select className={`${inputCls} mt-1`} value={courseId} disabled={loading} onChange={(event) => void load(event.target.value)}>
            {data.courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}{course.section ? ` · ${course.section}` : ""}</option>)}
          </select></label>
          <label className="text-sm font-medium">Attendance session<select className={`${inputCls} mt-1`} value={sessionId} disabled={loading || !courseId} onChange={(event) => void load(courseId, event.target.value)}>
            <option value="">New session</option>{data.sessions.map((session) => <option key={session.id} value={session.id}>{session.sessionDate} · {session.presentCount} present, {session.absentCount} absent</option>)}
          </select></label>
          <label className="text-sm font-medium">Date<input type="date" className={`${inputCls} mt-1`} value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} /></label>
          <label className="text-sm font-medium">Start time (optional)<input type="time" className={`${inputCls} mt-1`} value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
          <label className="text-sm font-medium">End time (optional)<input type="time" className={`${inputCls} mt-1`} value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
        </div>
      </Panel>
      {error && <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
      {loading ? <Panel><p className="py-6 text-center text-sm text-muted-foreground">Loading course attendance…</p></Panel> : data.students.length === 0 ? <Panel><EmptyState title="No enrolled students" desc="Students enrolled in this course will appear here." /></Panel> : <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">{data.course?.code} · Enrolled students</h2><p className="text-sm text-muted-foreground">Mark each student before saving.</p></div><button onClick={() => void save()} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : sessionId ? "Update attendance" : "Save attendance"}</button></div>
        <div className="divide-y">{data.students.map((student) => <div key={student.userId} className="flex flex-wrap items-center gap-3 py-3"><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{student.name}</span><span className="font-mono text-xs text-muted-foreground">{student.studentId || student.userId}</span></span><select aria-label={`Attendance for ${student.name}`} className={`${inputCls} w-36`} value={marks[student.userId] ?? ""} onChange={(event) => setMarks((current) => ({ ...current, [student.userId]: event.target.value as "Present" | "Absent" }))}><option value="" disabled>Mark status</option><option value="Present">Present</option><option value="Absent">Absent</option></select></div>)}</div>
      </Panel>}
      {!loading && data.students.length > 0 && data.sessions.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No previous sessions for this course yet.</p>}
    </>}
  </>;
}
