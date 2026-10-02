import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/settings")({
  head: () => seo("System Settings", "Configure CampusX."),
  component: PAdminSettings,
});

function PAdminSettings() {
  return (
    <>
      <PageHeader eyebrow="Configuration" title="System settings" /><Panel className="grid max-w-xl gap-4"><label className="grid gap-1.5"><span className="eyebrow">University name</span><input defaultValue="CampusX University" className={inputCls} /></label><label className="grid gap-1.5"><span className="eyebrow">Academic year</span><input defaultValue="2026–27" className={inputCls} /></label><label className="grid gap-1.5"><span className="eyebrow">Minimum attendance %</span><input defaultValue="75" className={inputCls} /></label></Panel>
    </>
  );
}
