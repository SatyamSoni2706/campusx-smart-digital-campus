import { createFileRoute } from "@tanstack/react-router";
import { ComplaintsView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faculty/issues")({
  head: () => seo("Student Issues", "Issues raised by students."),
  component: FacultyIssues,
});

function FacultyIssues() {
  return (
    <>
      <PageHeader eyebrow="Support" title="Student issues" />
      <ComplaintsView mode="faculty" />
    </>
  );
}
