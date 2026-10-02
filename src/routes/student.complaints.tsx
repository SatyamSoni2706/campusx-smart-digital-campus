import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ComplaintsView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { createComplaintFn, listComplaintsFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/student/complaints")({
  head: () => seo("Complaints", "Report and track campus issues."),
  loader: () => listComplaintsFn(),
  component: StudentComplaints,
});

function StudentComplaints() {
  const items = Route.useLoaderData();
  const createComplaint = useServerFn(createComplaintFn);
  return (
    <>
      <PageHeader eyebrow="Help desk" title="My complaints" />
      <ComplaintsView
        mode="student"
        initialItems={items}
        onSubmit={(data) => createComplaint({ data })}
      />
    </>
  );
}
