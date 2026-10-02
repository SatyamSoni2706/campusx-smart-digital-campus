import { createFileRoute } from "@tanstack/react-router";
import { NoticeBoard } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/student/notices")({
  head: () => seo("Notices", "Official university notices."),
  component: StudentNotices,
});

function StudentNotices() {
  return (
    <>
      <PageHeader eyebrow="Stay informed" title="Notices" />
      <NoticeBoard />
    </>
  );
}
