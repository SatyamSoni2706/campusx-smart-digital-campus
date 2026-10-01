import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "./PortalShell";

const links = [
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 size-[520px] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-0 top-40 size-[420px] rounded-full bg-warning/10 blur-3xl" />
      </div>
      <header className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-5">
        <Logo />
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground data-[status=active]:font-semibold data-[status=active]:text-foreground">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-ink/5">Sign in</Link>
          <Link to="/register" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-ink/90">Get started</Link>
        </div>
      </header>
      {children}
      <footer className="mx-auto mt-24 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t px-5 py-8 text-sm text-muted-foreground">
        <span>© 2026 CampusX · Smart University Digital Campus</span>
        <div className="flex gap-5">{links.map((l) => <Link key={l.to} to={l.to} className="hover:text-foreground">{l.label}</Link>)}</div>
      </footer>
    </div>
  );
}
