import { createFileRoute } from "@tanstack/react-router";
import { ComplaintsView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { listComplaintsFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/faculty/issues")({
  head: () => seo("Student Issues", "Issues raised by students."),
  loader: () => listComplaintsFn(),
  component: FacultyIssues,
});

function FacultyIssues() {
  const items = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Support" title="Student issues" />
      <ComplaintsView mode="faculty" initialItems={items} />
    </>
  );
}
