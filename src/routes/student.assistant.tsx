import { createFileRoute } from "@tanstack/react-router";
import { Assistant } from "@/components/campus/features";
import { PageHeader } from "@/components/campus/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/student/assistant")({
  head: () => seo("AI Campus Assistant", "Ask anything about your campus life."),
  component: StudentAssistant,
});

function StudentAssistant() {
  return (
    <>
      <PageHeader eyebrow="Beta" title="AI Campus Assistant" />
      <Assistant />
    </>
  );
}
