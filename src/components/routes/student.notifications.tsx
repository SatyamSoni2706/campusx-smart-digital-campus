import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, CalendarDays, FileText, Wrench } from "lucide-react";
import { PageHeader, Panel } from "@/components/campus/ui";
import { btnGhost } from "@/components/campus/features";
import { notifications as seed } from "@/data/mock";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/notifications")({
  head: () => seo("Notifications", "Alerts about deadlines, complaints, notices and events."),
  component: NotificationsPage,
});

const icons = { assignment: FileText, complaint: Wrench, notice: Bell, event: CalendarDays } as const;

function NotificationsPage() {
  const [items, setItems] = useState(seed);
  return (
    <>
      <PageHeader eyebrow={`${items.filter((n) => !n.read).length} unread`} title="Notifications"
        action={<button className={btnGhost} onClick={() => setItems((x) => x.map((n) => ({ ...n, read: true })))}>Mark all read</button>} />
      <Panel className="p-0">
        {items.map((n) => {
          const I = icons[n.type as keyof typeof icons] ?? Bell;
          return (
            <button key={n.id} onClick={() => setItems((x) => x.map((y) => (y.id === n.id ? { ...y, read: true } : y)))}
              className={cn("flex w-full items-start gap-4 border-b p-4 text-left last:border-0", !n.read && "bg-brand-soft/50")}>
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-card"><I className="size-4 text-primary" /></div>
              <div className="flex-1"><div className={cn("text-sm", !n.read ? "font-semibold" : "font-medium")}>{n.title}</div><div className="text-sm text-muted-foreground">{n.body}</div></div>
              <span className="font-mono text-[11px] text-muted-foreground">{n.time}</span>
            </button>
          );
        })}
      </Panel>
    </>
  );
}
