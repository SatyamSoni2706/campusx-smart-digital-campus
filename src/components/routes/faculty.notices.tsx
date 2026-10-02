import { createFileRoute } from "@tanstack/react-router";
import { NoticeBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faculty/notices")({
  head: () => seo("Faculty Notices", "Publish and read notices."),
  component: FacultyNotices,
});

function FacultyNotices() {
  return (
    <>
      <PageHeader eyebrow="Communication" title="Notices" />
      <NoticeBoard canPost />
    </>
  );
}
