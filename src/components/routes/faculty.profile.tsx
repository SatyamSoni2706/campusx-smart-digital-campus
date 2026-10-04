import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/campus/ui";
import { ProfileCard } from "@/components/campus/ProfileCard";
import { currentFaculty } from "@/data/mock";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faculty/profile")({
  head: () => seo("Faculty Profile", "Manage your CampusX profile."),
  component: FacultyProfile,
});

function FacultyProfile() {
  const s = currentFaculty;
  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" />
      <ProfileCard name={s.name} initials={s.initials} subtitle={s.designation} fields={[["Full name", s.name], ["Email", s.email], ["Department", s.dept], ["Designation", s.designation], ["Office", s.office]]} />
    </>
  );
}
