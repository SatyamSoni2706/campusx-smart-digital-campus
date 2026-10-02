import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader, Panel, PanelHeader, inputCls } from "@/components/campus/ui";
import { btn } from "@/components/campus/features";
import { Route as StudentRoute } from "./student";
import { updateStudentProfileFn } from "@/lib/auth.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/student/profile")({
  head: () => seo("Student Profile", "Manage your CampusX profile."),
  component: StudentProfile,
});

function StudentProfile() {
  const { user } = StudentRoute.useRouteContext();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await updateStudentProfileFn({
        data: {
          name: String(form.get("name")),
          email: String(form.get("email")),
          studentId: String(form.get("studentId")),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await router.invalidate();
      toast.success("Profile saved");
    } catch {
      setError("Could not save the profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel className="flex flex-col items-center text-center">
          <div className="grid size-24 place-items-center rounded-full bg-ink font-display text-3xl font-bold text-ink-foreground">
            {initials}
          </div>
          <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">
            {user.studentId ? `Student ID · ${user.studentId}` : "Student"}
          </p>
        </Panel>
        <Panel>
          <PanelHeader title="Details" />
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="eyebrow">Full name</span>
              <input name="name" required minLength={2} maxLength={100} defaultValue={user.name} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="eyebrow">Email</span>
              <input name="email" type="email" required maxLength={255} defaultValue={user.email} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="eyebrow">Student ID</span>
              <input name="studentId" required minLength={3} maxLength={32} defaultValue={user.studentId ?? ""} className={inputCls} />
            </label>
            {error && <p role="alert" className="text-sm text-danger sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <button disabled={saving} className={btn}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
