import { createFileRoute } from "@tanstack/react-router";
import { NoticeBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { listNoticesFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/student/notices")({
  head: () => seo("Notices", "Official university notices."),
  loader: () => listNoticesFn(),
  component: StudentNotices,
});

function StudentNotices() {
  const items = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Stay informed" title="Notices" />
      <NoticeBoard initialItems={items} />
    </>
  );
}
