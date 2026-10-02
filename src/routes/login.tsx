import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Panel, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import { loginFn } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  head: () => seo("Sign in", "Sign in to CampusX."),
  component: PLogin,
});

function PLogin() {
  const login = useServerFn(loginFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await login({
        data: { email: String(form.get("email")), password: String(form.get("password")) },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await router.invalidate();
      const destination =
        result.user.role === "Admin"
          ? "/admin"
          : result.user.role === "Faculty"
            ? "/faculty"
            : "/student";
      await router.navigate({ to: destination });
    } catch {
      setError("Sign in failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-5 pt-10">
        <Panel className="mx-auto grid max-w-sm gap-3">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <form onSubmit={submit} className="grid gap-3">
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={255}
              placeholder="University email"
              className={inputCls}
            />
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              placeholder="Password"
              className={inputCls}
            />
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-ink-foreground disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="text-xs text-muted-foreground">
            Use your student account or the admin demo account configured for this installation.
          </p>
          <Link to="/register" className="text-sm text-primary">
            Create a student account
          </Link>
        </Panel>
      </main>
    </PublicLayout>
  );
}
