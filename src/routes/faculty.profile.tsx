import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/campus/ui";
import { getFacultyFoundationFn } from "@/lib/campus.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faculty/profile")({
  head: () => seo("Faculty Profile", "Your authenticated CampusX identity."),
  loader: () => getFacultyFoundationFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading profile…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load profile: {String(error)}</p>,
  component: FacultyProfile,
});

function FacultyProfile() {
  const { identity } = Route.useLoaderData();
  const initials = identity.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel className="flex flex-col items-center text-center">
          <div className="grid size-24 place-items-center rounded-full bg-ink font-display text-3xl font-bold text-ink-foreground">{initials}</div>
          <h2 className="mt-4 text-xl font-bold">{identity.name}</h2>
          <p className="text-sm text-muted-foreground">Faculty account</p>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-bold">Account details</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="eyebrow">Full name</dt><dd className="mt-1 text-sm">{identity.name}</dd></div>
            <div><dt className="eyebrow">Email</dt><dd className="mt-1 text-sm">{identity.email}</dd></div>
            <div><dt className="eyebrow">User ID</dt><dd className="mt-1 break-all font-mono text-xs">{identity.id}</dd></div>
            {identity.studentId && <div><dt className="eyebrow">Student ID</dt><dd className="mt-1 text-sm">{identity.studentId}</dd></div>}
          </dl>
        </Panel>
      </div>
    </>
  );
}
