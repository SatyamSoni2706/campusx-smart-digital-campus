import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Stat, StatusBadge, inputCls } from "@/components/campus/ui";
import { PublicLayout } from "@/components/campus/PublicLayout";
import { seo } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact", "Get in touch with the CampusX team."),
  component: PContact,
});

function PContact() {
  return (
    <PublicLayout><main className="mx-auto max-w-6xl px-5 pt-10">
      <PageHeader eyebrow="Contact" title="Talk to us" /><Panel className="grid max-w-lg gap-3"><input placeholder="Name" className={inputCls} /><input placeholder="Email" className={inputCls} /><textarea rows={4} placeholder="Message" className={inputCls} /><button onClick={() => toast.success("Message sent")} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Send</button></Panel>
    </main></PublicLayout>
  );
}
