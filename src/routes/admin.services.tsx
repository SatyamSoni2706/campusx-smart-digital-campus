import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import * as D from "@/data/mock";

export const Route = createFileRoute("/admin/services")({
  head: () => seo("Campus Services", "Status of campus services."),
  component: PAdminServices,
});

function PAdminServices() {
  return (
    <>
      <PageHeader eyebrow="Operations" title="Campus services" /><div className="grid gap-4 md:grid-cols-3">{D.services.map((s) => (<Panel key={s.name}><div className="flex justify-between"><h3 className="font-bold">{s.name}</h3><StatusBadge value={s.status} /></div><p className="mt-2 text-sm text-muted-foreground">{s.desc}</p></Panel>))}</div>
    </>
  );
}
