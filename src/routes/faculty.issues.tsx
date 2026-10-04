import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ComplaintsView } from "@/components/campus/features";
import { EmptyState, PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { listFacultyComplaintsFn, updateAssignedComplaintFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/faculty/issues")({
  head: () => seo("Assigned Issues", "Review issues assigned to your Faculty account."),
  loader: () => listFacultyComplaintsFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading assigned issues…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load assigned issues: {String(error)}</p>,
  component: FacultyIssues,
});

function FacultyIssues() {
  const items = Route.useLoaderData();
  const updateComplaint = useServerFn(updateAssignedComplaintFn);
  return (
    <>
      <PageHeader eyebrow="Support" title="Assigned issues" desc="Review and update complaints assigned to your account." />
      {items.length === 0 ? <EmptyState title="No assigned issues" desc="Complaints assigned to your Faculty account will appear here." /> : (
        <ComplaintsView mode="faculty" initialItems={items} onUpdate={(id, status, resolutionInfo) =>
          updateComplaint({ data: { id, status, resolutionInfo } })
        } />
      )}
    </>
  );
}
