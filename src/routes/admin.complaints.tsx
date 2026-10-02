import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ComplaintsView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { listComplaintsFn, updateComplaintFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/admin/complaints")({
  head: () => seo("Manage Complaints", "Review and update complaint status."),
  loader: () => listComplaintsFn(),
  component: AdminComplaints,
});

function AdminComplaints() {
  const items = Route.useLoaderData();
  const updateComplaint = useServerFn(updateComplaintFn);
  return (
    <>
      <PageHeader eyebrow="Operations" title="Complaints" />
      <ComplaintsView
        mode="admin"
        initialItems={items}
        onUpdate={(id, status, resolutionInfo) =>
          updateComplaint({ data: { id, status, resolutionInfo } })
        }
      />
    </>
  );
}
