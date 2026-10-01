import { useMemo, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Users, Plus, Search, Send, Sparkles, ImagePlus, Bot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  notices as seedNotices, events as seedEvents, complaints as seedComplaints, lostFound as seedLost,
  timetable, days, todayKey, fmtDate, type Notice, type Complaint, type ComplaintStatus, type LostItem, type Priority,
} from "@/data/mock";
import { askAssistant } from "@/lib/assistant";
import { EmptyState, FilterChips, Panel, PanelHeader, StatusBadge, inputCls } from "./ui";
import { cn } from "@/lib/utils";

const btn = "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted";
export { btn, btnGhost };

/* ---------------- Timetable ---------------- */
export function TodaySchedule({ compact }: { compact?: boolean }) {
  const today = todayKey();
  const list = timetable.filter((t) => t.day === today);
  return (
    <div className="flex flex-col">
      {list.map((t, i) => (
        <div key={i} className="flex items-center gap-4 border-b py-3 last:border-0">
          <span className="w-12 font-mono text-xs text-muted-foreground">{t.start}</span>
          <span className="h-8 w-px bg-border" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{t.subject}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{t.room} · {t.faculty}</div>
          </div>
          {!compact && <span className="hidden rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">{t.type}</span>}
          {i === 0 && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">Up next</span>}
        </div>
      ))}
      {list.length === 0 && <EmptyState title="No classes today" />}
    </div>
  );
}

export function WeeklyTimetable() {
  const today = todayKey();
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {days.map((d) => (
        <div key={d} className={cn("glass rounded-xl p-3", d === today && "ring-2 ring-primary")}>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display font-bold">{d}</span>
            {d === today && <span className="eyebrow !text-primary">Today</span>}
          </div>
          <div className="flex flex-col gap-2">
            {timetable.filter((t) => t.day === d).map((t, i) => (
              <div key={i} className={cn("rounded-lg border-l-4 bg-card p-2.5", t.type === "Lab" ? "border-warning" : t.type === "Tutorial" ? "border-success" : "border-primary")}>
                <div className="font-mono text-[10px] text-muted-foreground">{t.start}–{t.end} · {t.type}</div>
                <div className="mt-0.5 text-sm font-semibold leading-snug">{t.subject}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{t.faculty}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{t.room}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Notices ---------------- */
const noticeCats = ["All", "Academic", "Exam", "Placement", "Finance", "Hostel", "General"] as const;
const prios = ["All", "Urgent", "High", "Medium", "Low"] as const;

export function NoticeBoard({ canPost }: { canPost?: boolean }) {
  const [items, setItems] = useState<Notice[]>(seedNotices);
  const [cat, setCat] = useState<(typeof noticeCats)[number]>("All");
  const [prio, setPrio] = useState<(typeof prios)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const filtered = items.filter((n) => (cat === "All" || n.category === cat) && (prio === "All" || n.priority === prio));
  const open = items.find((n) => n.id === openId);

  function view(id: string) {
    setOpenId(id);
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x)));
  }
  function post(fd: FormData) {
    const n: Notice = {
      id: crypto.randomUUID(), title: String(fd.get("title")), category: fd.get("category") as Notice["category"],
      description: String(fd.get("description")), priority: fd.get("priority") as Priority, department: String(fd.get("department")),
      date: new Date().toISOString().slice(0, 10), read: true,
    };
    setItems((xs) => [n, ...xs]); setPosting(false); toast.success("Notice published");
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips options={noticeCats} value={cat} onChange={setCat} />
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">{items.filter((x) => !x.read).length} unread</span>
            {canPost && <button className={btn} onClick={() => setPosting(true)}><Plus className="size-4" />New notice</button>}
          </div>
        </div>
        <FilterChips options={prios} value={prio} onChange={setPrio} />
      </div>
      <div className="flex flex-col gap-3">
        {filtered.map((n) => (
          <button key={n.id} onClick={() => view(n.id)} className="glass rise rounded-xl p-4 text-left transition hover:shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              {!n.read && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
              <StatusBadge value={n.priority} />
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{n.category}</span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">{fmtDate(n.date)}</span>
            </div>
            <div className={cn("mt-2", n.read ? "font-medium" : "font-semibold")}>{n.title}</div>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{n.description}</p>
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">{n.department}</div>
          </button>
        ))}
        {filtered.length === 0 && <EmptyState title="No notices match" desc="Try a different category or priority." />}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent>
          {open && (
            <>
              <DialogHeader>
                <div className="flex gap-2"><StatusBadge value={open.priority} /><span className="text-xs text-muted-foreground">{open.category} · {fmtDate(open.date)}</span></div>
                <DialogTitle className="font-display text-xl">{open.title}</DialogTitle>
                <DialogDescription>{open.department}</DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed">{open.description}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={posting} onOpenChange={setPosting}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Publish a notice</DialogTitle></DialogHeader>
          <form action={post} className="flex flex-col gap-3">
            <input name="title" required placeholder="Title" className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              <select name="category" className={inputCls}>{noticeCats.slice(1).map((c) => <option key={c}>{c}</option>)}</select>
              <select name="priority" className={inputCls}>{prios.slice(1).map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <input name="department" required placeholder="Department" className={inputCls} />
            <textarea name="description" required rows={4} placeholder="Details" className={inputCls} />
            <button className={btn}>Publish</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- Events ---------------- */
export function EventsBoard({ manage }: { manage?: boolean }) {
  const [items, setItems] = useState(seedEvents);
  const [creating, setCreating] = useState(false);
  function toggle(id: string) {
    setItems((xs) => xs.map((e) => {
      if (e.id !== id) return e;
      const next = !e.isRegistered;
      toast.success(next ? `Registered for ${e.title}` : "Registration cancelled");
      return { ...e, isRegistered: next, registered: e.registered + (next ? 1 : -1) };
    }));
  }
  function create(fd: FormData) {
    setItems((xs) => [...xs, {
      id: crypto.randomUUID(), title: String(fd.get("title")), date: String(fd.get("date")), time: String(fd.get("time")),
      venue: String(fd.get("venue")), organizer: String(fd.get("organizer")), description: String(fd.get("description")),
      category: "General", seats: Number(fd.get("seats")) || 100, registered: 0, isRegistered: false,
    }]);
    setCreating(false); toast.success("Event created");
  }
  return (
    <>
      {manage && <div className="mb-4 flex justify-end"><button className={btn} onClick={() => setCreating(true)}><Plus className="size-4" />New event</button></div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((e) => {
          const full = e.registered >= e.seats && !e.isRegistered;
          const d = new Date(e.date);
          return (
            <div key={e.id} className="glass rise flex flex-col rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="grid w-14 shrink-0 place-items-center rounded-lg bg-brand-soft py-2 text-center leading-none text-primary">
                  <span className="font-mono text-[10px] uppercase">{d.toLocaleString("en", { month: "short" })}</span>
                  <span className="font-display text-xl font-bold">{d.getDate()}</span>
                </div>
                <div className="min-w-0">
                  <span className="eyebrow">{e.category}</span>
                  <h3 className="font-bold leading-snug">{e.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{e.description}</p>
              <div className="mt-4 grid gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><Clock className="size-3.5" />{e.time}</span>
                <span className="flex items-center gap-2"><MapPin className="size-3.5" />{e.venue}</span>
                <span className="flex items-center gap-2"><Users className="size-3.5" />{e.organizer} · {e.registered}/{e.seats}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (e.registered / e.seats) * 100)}%` }} /></div>
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge value={e.isRegistered ? "Registered" : full ? "Full" : "Open"} />
                {!manage && (
                  <button disabled={full} onClick={() => toggle(e.id)} className={e.isRegistered ? btnGhost : btn}>
                    {e.isRegistered ? "Cancel" : full ? "Full" : "Register"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Create event</DialogTitle></DialogHeader>
          <form action={create} className="flex flex-col gap-3">
            <input name="title" required placeholder="Event title" className={inputCls} />
            <div className="grid grid-cols-2 gap-3"><input name="date" type="date" required className={inputCls} /><input name="time" required placeholder="5:00 PM" className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3"><input name="venue" required placeholder="Venue" className={inputCls} /><input name="seats" type="number" placeholder="Seats" className={inputCls} /></div>
            <input name="organizer" required placeholder="Organizer" className={inputCls} />
            <textarea name="description" rows={3} placeholder="Description" className={inputCls} />
            <button className={btn}>Create</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- Complaints ---------------- */
const statuses: ComplaintStatus[] = ["Submitted", "Under Review", "Assigned", "In Progress", "Resolved"];
const complaintCats = ["Classroom", "Infrastructure", "IT / Network", "Hostel", "Canteen", "Furniture", "Other"];

export function ComplaintTracker({ status }: { status: ComplaintStatus }) {
  const idx = statuses.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {statuses.map((s, i) => <div key={s} title={s} className={cn("h-1.5 flex-1 rounded-full", i <= idx ? (status === "Resolved" ? "bg-success" : "bg-primary") : "bg-border")} />)}
    </div>
  );
}

export function ComplaintsView({ mode }: { mode: "student" | "admin" | "faculty" }) {
  const [items, setItems] = useState<Complaint[]>(mode === "student" ? seedComplaints.filter((c) => c.by === "Ananya Sharma") : seedComplaints);
  const [filter, setFilter] = useState<"All" | ComplaintStatus>("All");
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const filtered = items.filter((c) => filter === "All" || c.status === filter);

  function submit(fd: FormData) {
    const c: Complaint = {
      id: `C-${1047 + items.length}`, title: String(fd.get("title")), category: String(fd.get("category")), description: String(fd.get("description")),
      location: String(fd.get("location")), priority: fd.get("priority") as Priority, status: "Submitted", date: new Date().toISOString().slice(0, 10), by: "Ananya Sharma",
    };
    setItems((xs) => [c, ...xs]); setCreating(false); setPreview(null); toast.success(`Complaint ${c.id} submitted`);
  }
  function update(id: string, s: ComplaintStatus) {
    setItems((xs) => xs.map((c) => (c.id === id ? { ...c, status: s } : c))); toast.success(`${id} → ${s}`);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterChips options={["All", ...statuses] as const} value={filter} onChange={setFilter} />
        {mode === "student" && <button className={btn} onClick={() => setCreating(true)}><Plus className="size-4" />New complaint</button>}
      </div>
      {mode === "student" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <div key={c.id} className="glass rise rounded-xl p-5">
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{c.id}</span><StatusBadge value={c.priority} /><StatusBadge value={c.status} className="ml-auto" /></div>
              <h3 className="mt-2 font-bold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <span>{c.category}</span><span>{c.location}</span><span>{fmtDate(c.date)}</span>{c.assignee && <span>→ {c.assignee}</span>}
              </div>
              <div className="mt-4"><ComplaintTracker status={c.status} /></div>
            </div>
          ))}
          {filtered.length === 0 && <div className="md:col-span-2"><EmptyState title="No complaints here" desc="Anything broken on campus? Report it in seconds." /></div>}
        </div>
      ) : (
        <div className="glass overflow-x-auto rounded-xl">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left"><th className="eyebrow p-3">ID</th><th className="eyebrow p-3">Issue</th><th className="eyebrow p-3">Reported by</th><th className="eyebrow p-3">Priority</th><th className="eyebrow p-3">Date</th><th className="eyebrow p-3">Status</th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-card/60">
                  <td className="p-3 font-mono text-xs">{c.id}</td>
                  <td className="p-3"><div className="font-semibold">{c.title}</div><div className="text-xs text-muted-foreground">{c.category} · {c.location}</div></td>
                  <td className="p-3">{c.by}</td>
                  <td className="p-3"><StatusBadge value={c.priority} /></td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{fmtDate(c.date)}</td>
                  <td className="p-3">
                    {mode === "admin" ? (
                      <select value={c.status} onChange={(e) => update(c.id, e.target.value as ComplaintStatus)} className="rounded-md border bg-card px-2 py-1 text-xs">
                        {statuses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : <StatusBadge value={c.status} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-6"><EmptyState title="No complaints" /></div>}
        </div>
      )}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Report an issue</DialogTitle><DialogDescription>We'll route it to the right team.</DialogDescription></DialogHeader>
          <form action={submit} className="flex flex-col gap-3">
            <input name="title" required placeholder="Complaint title" className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              <select name="category" className={inputCls}>{complaintCats.map((c) => <option key={c}>{c}</option>)}</select>
              <select name="priority" defaultValue="Medium" className={inputCls}>{(["Low", "Medium", "High", "Urgent"] as const).map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <input name="location" required placeholder="Location (e.g. LH-3, Block B)" className={inputCls} />
            <textarea name="description" required rows={3} placeholder="Describe the problem" className={inputCls} />
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              {preview ? <img src={preview} alt="Attachment preview" className="size-12 rounded object-cover" /> : <ImagePlus className="size-5" />}
              {preview ? "Image attached" : "Attach a photo (optional)"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
            </label>
            <button className={btn}>Submit complaint</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- Lost & Found ---------------- */
export function LostFoundView({ admin }: { admin?: boolean }) {
  const [items, setItems] = useState<LostItem[]>(seedLost);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"All" | "Lost" | "Found">("All");
  const [reporting, setReporting] = useState<null | "Lost" | "Found">(null);
  const [detail, setDetail] = useState<LostItem | null>(null);
  const filtered = useMemo(() => items.filter((i) => (kind === "All" || i.kind === kind) && (i.item + i.location + i.category).toLowerCase().includes(q.toLowerCase())), [items, q, kind]);

  function report(fd: FormData) {
    if (!reporting) return;
    setItems((xs) => [{ id: crypto.randomUUID(), kind: reporting, item: String(fd.get("item")), category: String(fd.get("category")), description: String(fd.get("description")), location: String(fd.get("location")), date: new Date().toISOString().slice(0, 10), reporter: "Ananya Sharma", contact: "ananya.sharma@campusx.edu", status: "Open" }, ...xs]);
    toast.success(`${reporting} item reported`); setReporting(null);
  }
  function claim(id: string) { setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status: "Claimed" } : x))); setDetail(null); toast.success("Marked as claimed"); }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="glass flex flex-1 items-center gap-2 rounded-lg px-3 py-2 md:max-w-sm"><Search className="size-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items or places…" className="w-full bg-transparent text-sm outline-none" /></div>
        <FilterChips options={["All", "Lost", "Found"] as const} value={kind} onChange={setKind} />
        {!admin && <div className="ml-auto flex gap-2"><button className={btnGhost} onClick={() => setReporting("Lost")}>Report lost</button><button className={btn} onClick={() => setReporting("Found")}>Report found</button></div>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((i) => (
          <button key={i.id} onClick={() => setDetail(i)} className="glass rise rounded-xl p-5 text-left hover:shadow-md">
            <div className="flex items-center gap-2"><StatusBadge value={i.kind} /><span className="text-[11px] text-muted-foreground">{i.category}</span><StatusBadge value={i.status} className="ml-auto" /></div>
            <h3 className="mt-3 font-bold">{i.item}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{i.description}</p>
            <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="size-3" />{i.location}</span><span className="flex items-center gap-1"><Calendar className="size-3" />{fmtDate(i.date)}</span></div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState title="Nothing found" desc="Try a different search." />}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          {detail && (<>
            <DialogHeader><div className="flex gap-2"><StatusBadge value={detail.kind} /><StatusBadge value={detail.status} /></div><DialogTitle className="font-display text-xl">{detail.item}</DialogTitle><DialogDescription>{detail.location} · {fmtDate(detail.date)}</DialogDescription></DialogHeader>
            <p className="text-sm">{detail.description}</p>
            <div className="rounded-lg bg-muted p-3 text-sm"><div className="eyebrow">Reported by</div>{detail.reporter} · {detail.contact}</div>
            <div className="flex gap-2">
              <a href={`mailto:${detail.contact}?subject=${encodeURIComponent("CampusX: " + detail.item)}`} className={btn}>Contact {detail.kind === "Found" ? "finder" : "owner"}</a>
              {detail.status === "Open" && <button className={btnGhost} onClick={() => claim(detail.id)}>Mark claimed</button>}
            </div>
          </>)}
        </DialogContent>
      </Dialog>
      <Dialog open={!!reporting} onOpenChange={(o) => !o && setReporting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Report {reporting?.toLowerCase()} item</DialogTitle></DialogHeader>
          <form action={report} className="flex flex-col gap-3">
            <input name="item" required placeholder="Item name" className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              <select name="category" className={inputCls}>{["Electronics", "Documents", "Personal", "Stationery", "Accessories", "Other"].map((c) => <option key={c}>{c}</option>)}</select>
              <input name="location" required placeholder="Where?" className={inputCls} />
            </div>
            <textarea name="description" rows={3} placeholder="Distinguishing details" className={inputCls} />
            <button className={btn}>Submit report</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- AI Assistant ---------------- */
const suggestions = ["What classes do I have tomorrow?", "What is my attendance?", "What notices were posted today?", "When is my next assignment due?", "What events are happening this week?", "Where can I report a broken projector?"];
type Msg = { role: "user" | "bot"; text: string };

function Rich({ text }: { text: string }) {
  return <>{text.split("\n").map((line, i) => <p key={i}>{line.split(/(\*\*[^*]+\*\*)/).map((p, j) => p.startsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : p)}</p>)}</>;
}

export function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: "Hi Ananya — I'm your Campus Intelligence Assistant. Ask me about classes, attendance, notices, deadlines or campus services." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send(q: string) {
    if (!q.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]); setInput(""); setBusy(true);
    const a = await askAssistant(q);
    setMsgs((m) => [...m, { role: "bot", text: a }]); setBusy(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="glass flex h-[calc(100vh-220px)] min-h-[480px] flex-col rounded-xl">
        <div className="flex items-center gap-3 border-b px-5 py-3">
          <div className="grid size-9 place-items-center rounded-lg bg-ink text-ink-foreground"><Sparkles className="size-4" /></div>
          <div><div className="font-display font-bold">Campus Intelligence</div><div className="flex items-center gap-1.5 font-mono text-[10px] text-success"><span className="size-1.5 rounded-full bg-success" />Online · demo mode</div></div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
              {m.role === "bot" && <div className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-primary"><Bot className="size-4" /></div>}
              <div className={cn("max-w-[80%] space-y-1 rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card border")}><Rich text={m.text} /></div>
            </div>
          ))}
          {busy && <div className="flex gap-3"><div className="grid size-7 place-items-center rounded-full bg-brand-soft text-primary"><Bot className="size-4" /></div><div className="flex flex-col gap-1.5 rounded-2xl border bg-card p-3"><Skeleton className="h-2.5 w-40" /><Skeleton className="h-2.5 w-24" /></div></div>}
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about campus…" className={inputCls} />
          <button className={btn} disabled={busy} aria-label="Send"><Send className="size-4" /></button>
        </form>
      </div>
      <Panel>
        <PanelHeader title="Try asking" />
        <div className="flex flex-col gap-2">
          {suggestions.map((s) => <button key={s} onClick={() => send(s)} className="rounded-lg border bg-card px-3 py-2 text-left text-sm hover:border-primary hover:text-primary">{s}</button>)}
        </div>
      </Panel>
    </div>
  );
}
