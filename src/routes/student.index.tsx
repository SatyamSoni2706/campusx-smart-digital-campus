import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, FileUp, PackageSearch, Sparkles, Wrench } from "lucide-react";
import { Panel, PanelHeader, Stat, StatusBadge } from "@/components/campus/ui";
import { TodaySchedule } from "@/components/campus/features";
import { fmtDate } from "@/data/mock";
import { seo } from "@/lib/seo";
import { getStudentDashboardFn } from "@/lib/campus.functions";

export const Route = createFileRoute("/student/")({
  head: () =>
    seo("Student Dashboard", "Your day at a glance: classes, attendance, deadlines and notices."),
  loader: () => getStudentDashboardFn(),
  component: StudentDashboard,
});

const quick = [
  { to: "/student/complaints", label: "Raise complaint", icon: Wrench },
  { to: "/student/assignments", label: "Submit work", icon: FileUp },
  { to: "/student/lost-found", label: "Lost & Found", icon: PackageSearch },
  { to: "/student/events", label: "Join event", icon: CalendarPlus },
] as const;

function StudentDashboard() {
  const data = Route.useLoaderData();
  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <>
      <div className="mb-6 rise">
        <div className="eyebrow">{dateStr}</div>
        <h1 className="text-2xl font-bold md:text-3xl">
          Good to see you, {data.studentName.split(" ")[0]}
        </h1>
      </div>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {data.attendance === null ? (
          <Stat label="Attendance" value="—" hint="No records yet" tone="muted" />
        ) : (
          <Stat
            label="Attendance"
            value={`${data.attendance}%`}
            hint="Current term"
            tone="success"
            bar={data.attendance}
          />
        )}
        <Stat
          label="Today's classes"
          value={data.todayClasses}
          hint={
            data.today
              ? `${data.today} · first at ${data.timetable[0]?.start ?? "—"}`
              : "No classes today"
          }
        />
        <Stat
          label="Due this week"
          value={data.pendingAssignments}
          hint={`Next · ${data.pendingAssignmentItems[0] ? fmtDate(data.pendingAssignmentItems[0].due) : "—"}`}
          tone="warning"
        />
        <Stat
          label="Complaints"
          value={data.totalComplaints}
          hint={`${data.openComplaints} open · ${data.resolvedComplaints} resolved`}
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Today's schedule"
            meta={data.today ?? "No classes today"}
            action={
              <Link to="/student/timetable" className="text-xs font-semibold text-primary">
                Full week →
              </Link>
            }
          />
          <TodaySchedule items={data.timetable} />
        </Panel>
        <Panel>
          <PanelHeader title="Latest notices" meta={`${data.notices} total`} />
          <div className="flex flex-col gap-3">
            {data.latestNotices.map((n) => (
              <Link
                to="/student/notices"
                key={n.id}
                className="rounded-lg border bg-card/60 p-3 hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <StatusBadge value={n.priority} />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {fmtDate(n.date)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-snug">{n.title}</p>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Upcoming assignments" meta={`${data.pendingAssignments} due`} />
          <div className="flex flex-col gap-3">
            {data.pendingAssignmentItems.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{a.title}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{a.subject}</div>
                </div>
                <span className="rounded-md bg-warning-soft px-2 py-1 font-mono text-[10px] font-semibold text-warning">
                  {fmtDate(a.due).slice(0, 6)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Upcoming events" />
          <div className="flex flex-col gap-3">
            {data.upcomingEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-soft font-display text-sm font-bold text-primary">
                  {new Date(e.date).getDate()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{e.title}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{e.venue}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-2">
            {quick.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="flex flex-col gap-2 rounded-lg border bg-card/60 p-3 text-sm font-medium hover:border-primary hover:text-primary"
              >
                <q.icon className="size-4" />
                {q.label}
              </Link>
            ))}
          </div>
          <Link
            to="/student/assistant"
            className="mt-3 flex items-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-semibold text-ink-foreground"
          >
            <Sparkles className="size-4" />
            Ask the AI assistant
          </Link>
        </Panel>

        <Panel className="xl:col-span-2">
          <PanelHeader title="Open complaints" />
          <div className="flex flex-col divide-y">
            {data.openComplaintItems.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                <span className="flex-1 truncate text-sm font-medium">{c.title}</span>
                <StatusBadge value={c.status} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHeader
            title="Notifications"
            action={
              <Link to="/student/notifications" className="text-xs font-semibold text-primary">
                All →
              </Link>
            }
          />
          <div className="flex flex-col gap-2.5">
            {data.latestNotifications.map((n) => (
              <div key={n.id} className="flex gap-2.5">
                {!n.read ? (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                ) : (
                  <span className="mt-1.5 size-2 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{n.time}</div>
                </div>
              </div>
            ))}
            {data.latestNotifications.length === 0 && (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            )}
          </div>
        </Panel>
      </section>
    </>
  );
}
