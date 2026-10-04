import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel } from "@/components/campus/ui";
import { getFacultyCourseDetailFn } from "@/lib/campus.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faculty/classes_/$courseId")({
  head: () => seo("Course Details", "Course roster, assignments, and attendance."),
  loader: ({ params }) => getFacultyCourseDetailFn({ data: { courseId: params.courseId } }),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading course…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load course: {String(error)}</p>,
  component: FacultyCourseDetail,
});

function FacultyCourseDetail() {
  const { course, students, assignments, attendance } = Route.useLoaderData();
  return (
    <>
      <PageHeader
        eyebrow={course.code}
        title={course.name}
        desc={`${course.section ? `Section ${course.section}` : "Section not set"}${course.semester ? ` · ${course.semester}` : ""} · ${course.studentCount} enrolled student${course.studentCount === 1 ? "" : "s"}`}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <a href="#enrolled-students" className="rounded-lg border px-3 py-2 text-sm font-semibold">Students</a>
        <Link to="/faculty/attendance" search={{ courseId: course.id }} className="rounded-lg border px-3 py-2 text-sm font-semibold">Attendance</Link>
        <Link to="/faculty/assignments" search={{ courseId: course.id }} className="rounded-lg border px-3 py-2 text-sm font-semibold">Assignments</Link>
      </div>

      <Panel className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="eyebrow">{course.code}</div><h2 className="text-lg font-bold">{course.name}</h2><p className="text-sm text-muted-foreground">{course.section ? `Section ${course.section}` : "Section not set"}{course.semester ? ` · ${course.semester}` : ""}</p></div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{course.studentCount} enrolled</span>
        </div>
      </Panel>

      <div id="enrolled-students" className="mb-4 scroll-mt-4"><Panel>
        <h2 className="mb-3 text-lg font-bold">Enrolled students</h2>
        {students.length === 0 ? <EmptyState title="No enrolled students" desc="Students enrolled in this course will appear here." /> : (
          <div className="divide-y">{students.map((student) => <div key={student.userId} className="flex items-center justify-between gap-3 py-3"><span className="font-medium">{student.name}</span><span className="font-mono text-xs text-muted-foreground">{student.studentId ?? "Student ID unavailable"}</span></div>)}</div>
        )}
      </Panel></div>

      <Panel className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Course assignments</h2><Link to="/faculty/assignments" search={{ courseId: course.id }} className="text-sm font-semibold text-primary">Open assignments →</Link></div>
        {assignments.length === 0 ? <EmptyState title="No assignments yet" desc="Assignments for this course will appear here." /> : (
          <div className="divide-y">{assignments.map((assignment) => <div key={assignment.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{assignment.title}</h3><span className="font-mono text-xs text-muted-foreground">Due {assignment.due}</span></div><p className="mt-1 text-sm text-muted-foreground">Max {assignment.maxMarks} marks · {assignment.submissionCount}/{assignment.totalStudents} submissions</p>{assignment.description && <p className="mt-2 whitespace-pre-wrap text-sm">{assignment.description}</p>}</div>)}</div>
        )}
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Attendance</h2><Link to="/faculty/attendance" search={{ courseId: course.id }} className="text-sm font-semibold text-primary">Open attendance →</Link></div>
        {attendance.sessionCount === 0 || !attendance.latestSession ? <EmptyState title="No attendance sessions yet" desc="Attendance sessions for this course will appear here." /> : <p className="text-sm text-muted-foreground">{attendance.sessionCount} session{attendance.sessionCount === 1 ? "" : "s"} recorded · Latest {attendance.latestSession.sessionDate} · {attendance.latestSession.presentCount} present, {attendance.latestSession.absentCount} absent</p>}
      </Panel>
    </>
  );
}
