import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { NoticeBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { createNoticeFn, listNoticesFn, updateNoticeFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/admin/notices")({
  head: () => seo("Manage Notices", "Publish university-wide notices."),
  loader: () => listNoticesFn(),
  component: AdminNotices,
});

function AdminNotices() {
  const items = Route.useLoaderData();
  const createNotice = useServerFn(createNoticeFn);
  const updateNotice = useServerFn(updateNoticeFn);
  return (
    <>
      <PageHeader eyebrow="Communication" title="Notices" />
      <NoticeBoard
        canPost
        initialItems={items}
        onCreate={(data) => createNotice({ data })}
        onUpdate={(id, data) => updateNotice({ data: { id, ...data } })}
      />
    </>
  );
}
