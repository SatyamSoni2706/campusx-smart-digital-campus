import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Smart University Digital Campus", "CampusX unifies timetables, notices, complaints and analytics for students, faculty and admins."),
  component: PIndex,
});

function PIndex() {
  return (
    <PublicLayout><main className="mx-auto max-w-6xl px-5 pt-10">
      <section className="py-16 text-center"><div className="eyebrow">Smart University Digital Campus</div><h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold md:text-6xl">Your entire campus, in one place.</h1><p className="mx-auto mt-4 max-w-xl text-muted-foreground">Timetables, attendance, notices, events, complaints and an AI assistant — for students, faculty and administrators.</p><div className="mt-8 flex justify-center gap-3"><Link to="/student" className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-ink-foreground">Open student demo</Link><Link to="/admin" className="rounded-lg border bg-card px-5 py-3 text-sm font-semibold">Admin demo</Link></div></section><div className="grid gap-3 md:grid-cols-3"><Stat label="Students" value="8,420" /><Stat label="Complaints resolved" value="284" tone="success" hint="avg 2.4 days" /><Stat label="Faculty" value="412" /></div>
    </main></PublicLayout>
  );
}
