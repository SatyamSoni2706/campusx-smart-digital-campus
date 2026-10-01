import { createFileRoute } from "@tanstack/react-router";
import { ComplaintsView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/student/complaints")({
  head: () => seo("Complaints", "Report and track campus issues."),
  component: StudentComplaints,
});

function StudentComplaints() {
  return (
    <>
      <PageHeader eyebrow="Help desk" title="My complaints" />
      <ComplaintsView mode="student" />
    </>
  );
}
