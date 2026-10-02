import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { EmptyState, PageHeader, Panel, inputCls } from "@/components/campus/ui";
import {
  assignFacultyCourseFn,
  createCourseFn,
  enrollStudentCourseFn,
  getAdminFacultyFn,
} from "@/lib/campus.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/faculty")({
  head: () => seo("Faculty Management", "Manage registered faculty accounts."),
  loader: () => getAdminFacultyFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading faculty and courses…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load faculty: {String(error)}</p>,
  component: PAdminFaculty,
});

function PAdminFaculty() {
  const { faculty, students, courses } = Route.useLoaderData();
  const router = useRouter();

  async function createCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await createCourseFn({ data: {
        code: String(form.get("code")),
        name: String(form.get("name")),
        semester: String(form.get("semester") ?? ""),
        section: String(form.get("section") ?? ""),
      } });
      formElement.reset();
      await router.invalidate();
      toast.success("Course created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the course.");
    }
  }

  async function assignFaculty(event: React.FormEvent<HTMLFormElement>, courseId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await assignFacultyCourseFn({ data: { courseId, userId: String(form.get("userId")) } });
      await router.invalidate();
      toast.success(result.alreadyAssigned ? "Faculty member is already assigned" : "Faculty member assigned");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not assign faculty.");
    }
  }

  async function enrollStudent(event: React.FormEvent<HTMLFormElement>, courseId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await enrollStudentCourseFn({ data: { courseId, userId: String(form.get("userId")) } });
      await router.invalidate();
      toast.success(result.alreadyEnrolled ? "Student is already enrolled" : "Student enrolled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enroll student.");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Registered accounts" title="Faculty" desc="Faculty accounts and course relationships are stored in SQLite." />
      <Panel className="overflow-x-auto p-0">
        {faculty.length === 0 ? <EmptyState title="No registered faculty" desc="Faculty accounts will appear here when available." /> : (
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b text-left"><th className="eyebrow p-3">Name</th><th className="eyebrow p-3">Email</th></tr></thead>
            <tbody>{faculty.map((member) => <tr key={member.id} className="border-b last:border-0"><td className="p-3">{member.name}</td><td className="p-3">{member.email}</td></tr>)}</tbody>
          </table>
        )}
      </Panel>
      <Panel className="mt-4">
        <h2 className="mb-3 text-lg font-bold">Create course</h2>
        <form onSubmit={createCourse} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input name="code" required maxLength={24} placeholder="Course code" className={inputCls} />
          <input name="name" required maxLength={120} placeholder="Course name" className={inputCls} />
          <input name="semester" maxLength={40} placeholder="Semester (optional)" className={inputCls} />
          <div className="flex gap-2"><input name="section" maxLength={40} placeholder="Section (optional)" className={inputCls} /><button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Create</button></div>
        </form>
      </Panel>
      <div className="mt-4 space-y-3">
        {courses.length === 0 ? <Panel><EmptyState title="No courses yet" desc="Create a course above, then assign faculty and enroll students." /></Panel> : courses.map((course) => (
          <Panel key={course.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="eyebrow">{course.code}{course.section ? ` · ${course.section}` : ""}{course.semester ? ` · ${course.semester}` : ""}</div><h3 className="font-bold">{course.name}</h3><p className="text-sm text-muted-foreground">{course.studentCount} enrolled · Faculty: {course.facultyNames || "Unassigned"}</p></div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{course.status}</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <form onSubmit={(event) => void assignFaculty(event, course.id)} className="flex gap-2">
                <select name="userId" required className={inputCls} defaultValue=""><option value="" disabled>Assign faculty</option>{faculty.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.email}</option>)}</select>
                <button disabled={!faculty.length} className="rounded-lg border px-3 text-sm font-semibold disabled:opacity-50">Assign</button>
              </form>
              <form onSubmit={(event) => void enrollStudent(event, course.id)} className="flex gap-2">
                <select name="userId" required className={inputCls} defaultValue=""><option value="" disabled>Enroll student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.studentId || student.email}</option>)}</select>
                <button disabled={!students.length} className="rounded-lg border px-3 text-sm font-semibold disabled:opacity-50">Enroll</button>
              </form>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
