import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/campus/ui";
import { ProfileCard } from "@/components/campus/ProfileCard";
import { currentStudent } from "@/data/mock";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/student/profile")({
  head: () => seo("Student Profile", "Manage your CampusX profile."),
  component: StudentProfile,
});

function StudentProfile() {
  const s = currentStudent;
  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" />
      <ProfileCard name={s.name} initials={s.initials} subtitle={`${s.roll} · Semester ${s.semester}`} fields={[["Full name", s.name], ["Email", s.email], ["Phone", s.phone], ["Department", s.dept], ["Section", s.section], ["Faculty advisor", s.advisor]]} />
    </>
  );
}
