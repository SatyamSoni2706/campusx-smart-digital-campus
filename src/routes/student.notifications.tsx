import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Bell, CalendarDays, FileText, Wrench } from "lucide-react";
import { PageHeader, Panel } from "@/components/campus/ui";
import { btnGhost } from "@/components/campus/features";
import { seo } from "@/lib/seo";
import { getStudentNotificationsFn, setStudentNotificationsReadFn } from "@/lib/campus.functions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/student/notifications")({
  head: () => seo("Notifications", "Alerts about deadlines, complaints, notices and events."),
  loader: () => getStudentNotificationsFn(),
  component: NotificationsPage,
});

const icons = { assignment: FileText, complaint: Wrench, notice: Bell, event: CalendarDays } as const;

function NotificationsPage() {
  const initialItems = Route.useLoaderData();
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);
  const updateReadState = useServerFn(setStudentNotificationsReadFn);

  async function markRead(id: string) {
    try {
      await updateReadState({ data: { mode: "one", id } });
      setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this notification.");
    }
  }

  async function markAllRead() {
    setSaving(true);
    try {
      await updateReadState({ data: { mode: "all" } });
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notifications.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow={`${items.filter((n) => !n.read).length} unread`} title="Notifications"
        action={<button className={btnGhost} disabled={saving} onClick={() => void markAllRead()}>{saving ? "Saving…" : "Mark all read"}</button>} />
      <Panel className="p-0">
        {items.map((n) => {
          const I = icons[n.type as keyof typeof icons] ?? Bell;
          return (
            <button key={n.id} onClick={() => !n.read && void markRead(n.id)}
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
