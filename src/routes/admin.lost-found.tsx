import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LostFoundView } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";
import { claimFoundItemFn, listLostFoundFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/admin/lost-found")({
  head: () => seo("Lost & Found Desk", "Oversee lost and found reports."),
  loader: () => listLostFoundFn(),
  component: AdminLostFound,
});

function AdminLostFound() {
  const items = Route.useLoaderData();
  const claimItem = useServerFn(claimFoundItemFn);
  return (
    <>
      <PageHeader eyebrow="Operations" title="Lost & Found" />
      <LostFoundView admin initialItems={items} onClaim={(id) => claimItem({ data: { id } })} />
    </>
  );
}
