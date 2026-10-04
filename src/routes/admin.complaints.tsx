import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ComplaintsView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { assignComplaintFacultyFn, listAdminComplaintFacultyFn, listComplaintsFn, updateComplaintFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/admin/complaints")({
  head: () => seo("Manage Complaints", "Review and update complaint status."),
  loader: async () => {
    const [items, facultyOptions] = await Promise.all([listComplaintsFn(), listAdminComplaintFacultyFn()]);
    return { items, facultyOptions };
  },
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading complaints…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load complaints: {String(error)}</p>,
  component: AdminComplaints,
});

function AdminComplaints() {
  const { items, facultyOptions } = Route.useLoaderData();
  const updateComplaint = useServerFn(updateComplaintFn);
  const assignComplaint = useServerFn(assignComplaintFacultyFn);
  return (
    <>
      <PageHeader eyebrow="Operations" title="Complaints" />
      <ComplaintsView
        mode="admin"
        initialItems={items}
        facultyOptions={facultyOptions}
        onAssign={(complaintId, facultyUserId) => assignComplaint({ data: { complaintId, facultyUserId } }).then(() => undefined)}
        onUpdate={(id, status, resolutionInfo) =>
          updateComplaint({ data: { id, status, resolutionInfo } })
        }
      />
    </>
  );
}
