import { createFileRoute } from "@tanstack/react-router";
import { ComplaintsView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/complaints")({
  head: () => seo("Manage Complaints", "Review and update complaint status."),
  component: AdminComplaints,
});

function AdminComplaints() {
  return (
    <>
      <PageHeader eyebrow="Operations" title="Complaints" />
      <ComplaintsView mode="admin" />
    </>
  );
}
