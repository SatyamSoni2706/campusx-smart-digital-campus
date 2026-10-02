import { createFileRoute } from "@tanstack/react-router";
import { NoticeBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { listNoticesFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/faculty/notices")({
  head: () => seo("Faculty Notices", "Publish and read notices."),
  loader: () => listNoticesFn(),
  component: FacultyNotices,
});

function FacultyNotices() {
  const items = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Communication" title="Notices" />
      <NoticeBoard initialItems={items} />
    </>
  );
}
