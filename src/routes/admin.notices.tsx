import { createFileRoute } from "@tanstack/react-router";
import { NoticeBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/notices")({
  head: () => seo("Manage Notices", "Publish university-wide notices."),
  component: AdminNotices,
});

function AdminNotices() {
  return (
    <>
      <PageHeader eyebrow="Communication" title="Notices" />
      <NoticeBoard canPost />
    </>
  );
}
