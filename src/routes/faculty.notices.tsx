import { createFileRoute } from "@tanstack/react-router";
import { NoticeBoard } from "@/components/campus/features";
import { EmptyState, PageHeader, Panel } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { listFacultyNoticesFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/faculty/notices")({
  head: () => seo("Faculty Notices", "Read university notices."),
  loader: () => listFacultyNoticesFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading notices…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load notices: {String(error)}</p>,
  component: FacultyNotices,
});

function FacultyNotices() {
  const items = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Communication" title="Notices" />
      {items.length === 0 ? <Panel><EmptyState title="No notices yet" desc="Published university notices will appear here." /></Panel> : <NoticeBoard initialItems={items} />}
    </>
  );
}
