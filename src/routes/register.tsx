import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Panel, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import { registerStudentFn } from "@/lib/auth.functions";

export const Route = createFileRoute("/register")({
  head: () => seo("Register", "Create your CampusX account."),
  component: PRegister,
});

function PRegister() {
  const register = useServerFn(registerStudentFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await register({
        data: {
          name: String(form.get("name")),
          email: String(form.get("email")),
          studentId: String(form.get("studentId")),
          password: String(form.get("password")),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await router.invalidate();
      await router.navigate({ to: "/student" });
    } catch {
      setError("Account creation failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-5 pt-10">
        <Panel className="mx-auto grid max-w-sm gap-3">
          <h1 className="text-2xl font-bold">Create student account</h1>
          <form onSubmit={submit} className="grid gap-3">
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="Full name"
              className={inputCls}
            />
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              placeholder="University email"
              className={inputCls}
            />
            <input
              name="studentId"
              required
              minLength={3}
              maxLength={32}
              placeholder="Student ID"
              className={inputCls}
            />
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
              placeholder="Password (10+ characters)"
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
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>
          <Link to="/login" className="text-sm text-primary">
            Already have an account? Sign in
          </Link>
        </Panel>
      </main>
    </PublicLayout>
  );
}
