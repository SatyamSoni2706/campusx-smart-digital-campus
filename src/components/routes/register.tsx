import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/register")({
  head: () => seo("Register", "Create your CampusX account."),
  component: PRegister,
});

function PRegister() {
  return (
    <PublicLayout><main className="mx-auto max-w-6xl px-5 pt-10">
      <Panel className="mx-auto grid max-w-sm gap-3"><h1 className="text-2xl font-bold">Create account</h1><input placeholder="Full name" className={inputCls} /><input placeholder="University email" className={inputCls} /><input placeholder="Roll / Employee ID" className={inputCls} /><input type="password" placeholder="Password" className={inputCls} /><div className="grid gap-2">{(["/student", "/faculty", "/admin"] as const).map((to) => (<Link key={to} to={to} className="rounded-lg bg-ink px-4 py-2.5 text-center text-sm font-semibold text-ink-foreground">Continue as {to.slice(1)}</Link>))}</div></Panel>
    </main></PublicLayout>
  );
}
