import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CalendarDays, FileText, Wrench } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/campus/ui";
import { btnGhost } from "@/components/campus/features";
import { getFacultyNotificationsFn, setFacultyNotificationsReadFn } from "@/lib/campus.functions";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/notifications")({
  head: () => seo("Faculty Notifications", "Notifications for your Faculty account."),
  loader: () => getFacultyNotificationsFn(),
  pendingComponent: () => <p className="py-8 text-sm text-muted-foreground">Loading notifications…</p>,
  errorComponent: ({ error }) => <p className="py-8 text-sm text-danger">Could not load notifications: {String(error)}</p>,
  component: FacultyNotifications,
});

const icons = { assignment: FileText, complaint: Wrench, notice: Bell, event: CalendarDays } as const;

function FacultyNotifications() {
  const initial = Route.useLoaderData();
  const [items, setItems] = useState(initial.items);
  const [unreadCount, setUnreadCount] = useState(initial.unreadCount);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const updateReadState = useServerFn(setFacultyNotificationsReadFn);
  const router = useRouter();

  useEffect(() => {
    setItems(initial.items);
    setUnreadCount(initial.unreadCount);
  }, [initial]);

  async function markRead(id: string) {
    if (savingId) return;
    setSavingId(id);
    try {
      await updateReadState({ data: { mode: "one", id } });
      setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this notification.");
    } finally {
      setSavingId(null);
    }
  }

  async function markAllRead() {
    if (savingAll || unreadCount === 0) return;
    setSavingAll(true);
    try {
      await updateReadState({ data: { mode: "all" } });
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notifications.");
    } finally {
      setSavingAll(false);
    }
  }

  return <>
    <PageHeader
      eyebrow={`${unreadCount} unread`}
      title="Notifications"
      action={<button type="button" className={btnGhost} disabled={savingAll || unreadCount === 0} onClick={() => void markAllRead()}>
        {savingAll ? "Saving…" : "Mark all read"}
      </button>}
    />
    <Panel className="p-0">
      {items.length === 0 ? <EmptyState title="No notifications" desc="Notifications for your Faculty account will appear here." /> : items.map((item) => {
        const Icon = icons[item.type] ?? Bell;
        return <button
          key={item.id}
          type="button"
          disabled={savingId === item.id || savingAll}
          onClick={() => !item.read && void markRead(item.id)}
          className={cn("flex w-full items-start gap-4 border-b p-4 text-left last:border-0 disabled:opacity-70", !item.read && "bg-brand-soft/50")}
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-card"><Icon className="size-4 text-primary" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {!item.read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              <span className={cn("text-sm", !item.read ? "font-semibold" : "font-medium")}>{item.title}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
          </div>
          <time className="shrink-0 text-right font-mono text-[11px] text-muted-foreground" dateTime={item.createdAt}>
            {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </time>
        </button>;
      })}
    </Panel>
  </>;
}
