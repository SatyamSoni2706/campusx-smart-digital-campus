import { createFileRoute } from "@tanstack/react-router";
import { LostFoundView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/student/lost-found")({
  head: () => seo("Lost & Found", "Report and find lost items on campus."),
  component: StudentLostFound,
});

function StudentLostFound() {
  return (
    <>
      <PageHeader eyebrow="Community" title="Lost & Found" />
      <LostFoundView />
    </>
  );
}
