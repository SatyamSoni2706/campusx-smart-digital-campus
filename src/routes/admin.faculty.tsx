import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { EmptyState, PageHeader, Panel, inputCls } from "@/components/campus/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  assignFacultyCourseFn,
  createFacultyFn,
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
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [creatingFaculty, setCreatingFaculty] = useState(false);
  const [facultyError, setFacultyError] = useState("");

  async function createFaculty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setCreatingFaculty(true);
    setFacultyError("");
    try {
      const created = await createFacultyFn({ data: {
        name: String(form.get("name")),
        facultyId: String(form.get("facultyId")),
        email: String(form.get("email")),
        password: String(form.get("password")),
      } });
      formElement.reset();
      setAddingFaculty(false);
      await router.invalidate();
      toast.success(`Faculty account created for ${created.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create the faculty account.";
      setFacultyError(message);
      toast.error(message);
    } finally {
      setCreatingFaculty(false);
    }
  }

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
      <PageHeader
        eyebrow="Registered accounts"
        title="Faculty"
        desc="Faculty accounts and course relationships are stored in SQLite."
        action={<button onClick={() => { setFacultyError(""); setAddingFaculty(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="size-4" />Add Faculty</button>}
      />
      <Panel className="overflow-x-auto p-0">
        {faculty.length === 0 ? <EmptyState title="No registered faculty" desc="Faculty accounts will appear here when available." /> : (
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left"><th className="eyebrow p-3">Faculty ID</th><th className="eyebrow p-3">Full name</th><th className="eyebrow p-3">Email</th><th className="eyebrow p-3">Assigned courses</th></tr></thead>
            <tbody>{faculty.map((member) => <tr key={member.id} className="border-b last:border-0"><td className="p-3 font-mono text-xs">{member.facultyId || "—"}</td><td className="p-3 font-medium">{member.name}{member.isDemo ? <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Demo account</span> : null}</td><td className="p-3">{member.email}</td><td className="p-3">{member.assignedCourseCount}</td></tr>)}</tbody>
          </table>
        )}
      </Panel>
      <Dialog open={addingFaculty} onOpenChange={(open) => { setAddingFaculty(open); if (!open) setFacultyError(""); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">Add Faculty</DialogTitle>
            <DialogDescription>Create a Faculty account that can sign in to the Faculty Portal. Department, designation, and phone are not stored by the current schema.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void createFaculty(event)} className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">Full name<input name="name" autoComplete="name" minLength={2} maxLength={100} required className={inputCls} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Faculty ID<input name="facultyId" minLength={3} maxLength={32} required className={inputCls} /></label>
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Email<input name="email" type="email" autoComplete="email" maxLength={255} required className={inputCls} /></label>
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Initial password<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required className={inputCls} /><span className="text-xs font-normal text-muted-foreground">At least 10 characters. The password is stored as a hash.</span></label>
            {facultyError && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">{facultyError}</div>}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setAddingFaculty(false)} disabled={creatingFaculty} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={creatingFaculty} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{creatingFaculty ? "Creating…" : "Create Faculty"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
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
