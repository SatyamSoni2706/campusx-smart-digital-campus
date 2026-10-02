import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LostFoundView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { claimFoundItemFn, createLostFoundItemFn, listLostFoundFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/student/lost-found")({
  head: () => seo("Lost & Found", "Report and find lost items on campus."),
  loader: () => listLostFoundFn(),
  component: StudentLostFound,
});

function StudentLostFound() {
  const items = Route.useLoaderData();
  const createItem = useServerFn(createLostFoundItemFn);
  const claimItem = useServerFn(claimFoundItemFn);
  return (
    <>
      <PageHeader eyebrow="Community" title="Lost & Found" />
      <LostFoundView
        initialItems={items}
        onReport={(data) => createItem({ data })}
        onClaim={(id) => claimItem({ data: { id } })}
      />
    </>
  );
}
