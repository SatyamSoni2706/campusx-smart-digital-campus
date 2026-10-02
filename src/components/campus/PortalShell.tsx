import { Link, Outlet, type LinkProps } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ComponentType } from "react";
import { Bell, Menu, Search, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutFn } from "@/lib/auth.functions";
import { toast } from "sonner";

export type NavItem = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-lg bg-ink font-display text-sm font-bold text-ink-foreground">
        CX
      </div>
      <div className="font-display text-[15px] font-bold tracking-tight">CampusX</div>
    </Link>
  );
}

export function PortalShell({
  role,
  nav,
  user,
  notifyTo,
}: {
  role: string;
  nav: NavItem[];
  user: { name: string; initials: string; sub: string };
  notifyTo?: NonNullable<LinkProps["to"]>;
}) {
  const [open, setOpen] = useState(false);
  const logout = useServerFn(logoutFn);
  async function signOut() {
    try {
      await logout();
      window.location.assign("/login");
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }
  const sidebar = (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <Logo />
          <div className="eyebrow mt-1 pl-[46px]">{role} Portal</div>
        </div>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <nav className="mt-8 flex flex-col gap-0.5 overflow-y-auto">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact: true }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-ink/5 hover:text-foreground data-[status=active]:bg-brand-soft data-[status=active]:font-semibold data-[status=active]:text-primary"
          >
            <n.icon className="size-4" />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border bg-card/60 p-3">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-full bg-ink font-display text-xs font-bold text-ink-foreground">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{user.sub}</div>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 size-[360px] rounded-full bg-warning/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-[380px] rounded-full bg-success/10 blur-3xl" />
      </div>
      <div className="mx-auto flex max-w-[1480px]">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r bg-sidebar backdrop-blur-xl lg:block">
          {sidebar}
        </aside>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[270px] bg-card">{sidebar}</aside>
          </div>
        )}
        <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-6">
          <header className="mb-6 flex items-center gap-3">
            <button
              className="grid size-9 place-items-center rounded-lg border bg-card lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
            <div className="glass hidden max-w-sm flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground md:flex">
              <Search className="size-4" />
              <input
                placeholder="Search courses, notices, people…"
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              />
              <span className="rounded border px-1.5 font-mono text-[10px]">⌘K</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {notifyTo ? (
                <Link
                  to={notifyTo}
                  className="glass relative grid size-9 place-items-center rounded-lg"
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-danger text-[9px] font-bold text-primary-foreground">
                    3
                  </span>
                </Link>
              ) : (
                <span className="glass grid size-9 place-items-center rounded-lg">
                  <Bell className="size-4" />
                </span>
              )}
              <div className="grid size-9 place-items-center rounded-full bg-ink font-display text-xs font-bold text-ink-foreground">
                {user.initials}
              </div>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function cxNavClass(active: boolean) {
  return cn(active && "text-foreground");
}
