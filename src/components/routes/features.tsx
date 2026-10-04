import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/features")({
  head: () => seo("Features", "Everything CampusX does."),
  component: PFeatures,
});

function PFeatures() {
  return (
    <PublicLayout><main className="mx-auto max-w-6xl px-5 pt-10">
      <PageHeader eyebrow="Features" title="Built for every role" /><div className="grid gap-4 md:grid-cols-3">{["Smart timetable","Attendance tracking","Notice board","Events & registration","Complaint tracking","Lost & Found","AI campus assistant","Admin analytics","Campus services"].map((f) => (<Panel key={f}><h3 className="font-bold">{f}</h3></Panel>))}</div>
    </main></PublicLayout>
  );
}
