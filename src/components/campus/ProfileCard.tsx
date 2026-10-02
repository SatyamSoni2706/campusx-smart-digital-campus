import { toast } from "sonner";
import { Panel, PanelHeader, inputCls } from "./ui";
import { btn } from "./features";

export function ProfileCard({ name, initials, subtitle, fields }: { name: string; initials: string; subtitle: string; fields: [string, string][] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Panel className="flex flex-col items-center text-center">
        <div className="grid size-24 place-items-center rounded-full bg-ink font-display text-3xl font-bold text-ink-foreground">{initials}</div>
        <h2 className="mt-4 text-xl font-bold">{name}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </Panel>
      <Panel>
        <PanelHeader title="Details" />
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Profile saved"); }} className="grid gap-4 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <label key={label} className="flex flex-col gap-1.5"><span className="eyebrow">{label}</span><input defaultValue={value} className={inputCls} /></label>
          ))}
          <div className="sm:col-span-2"><button className={btn}>Save changes</button></div>
        </form>
      </Panel>
    </div>
  );
}
