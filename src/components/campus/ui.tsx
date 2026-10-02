import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass rounded-xl p-5 rise", className)}>{children}</div>;
}

export function PanelHeader({ title, meta, action }: { title: string; meta?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="flex items-center gap-3">
        {meta && <span className="font-mono text-[11px] text-muted-foreground">{meta}</span>}
        {action}
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, desc, action }: { eyebrow?: string; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rise">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "muted", bar }: { label: string; value: ReactNode; hint?: string; tone?: "success" | "warning" | "danger" | "muted" | "primary"; bar?: number }) {
  const toneCls = { success: "text-success", warning: "text-warning", danger: "text-danger", muted: "text-muted-foreground", primary: "text-primary" }[tone];
  const barCls = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", muted: "bg-muted-foreground", primary: "bg-primary" }[tone];
  return (
    <div className="glass rounded-xl p-4 rise">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className={cn("mt-1 font-mono text-[11px]", toneCls)}>{hint}</div>}
      {bar !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
          <div className={cn("h-full rounded-full", barCls)} style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}

const tones: Record<string, string> = {
  Urgent: "bg-danger-soft text-danger", High: "bg-warning-soft text-warning", Medium: "bg-brand-soft text-primary", Low: "bg-muted text-muted-foreground",
  Submitted: "bg-muted text-muted-foreground", "Under Review": "bg-warning-soft text-warning", Assigned: "bg-brand-soft text-primary",
  "In Progress": "bg-brand-soft text-primary", Resolved: "bg-success-soft text-success", Rejected: "bg-danger-soft text-danger",
  Pending: "bg-warning-soft text-warning", Graded: "bg-success-soft text-success", Overdue: "bg-danger-soft text-danger",
  Lost: "bg-danger-soft text-danger", Found: "bg-success-soft text-success", Open: "bg-brand-soft text-primary", Claimed: "bg-muted text-muted-foreground",
  Active: "bg-success-soft text-success", Probation: "bg-danger-soft text-danger",
  Operational: "bg-success-soft text-success", Degraded: "bg-warning-soft text-warning", Maintenance: "bg-danger-soft text-danger",
  Registered: "bg-success-soft text-success", Full: "bg-muted text-muted-foreground",
};
export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold", tones[value] ?? "bg-muted text-muted-foreground", className)}>
      {value}
    </span>
  );
}

export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <div className="mt-3 font-semibold">{title}</div>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
    </div>
  );
}

export function FilterChips<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === o ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>
          {o}
        </button>
      ))}
    </div>
  );
}

export const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30";
