// Mock campus assistant. Swap `askAssistant` for a real AI call later (same signature).
import { assignments, attendance, events, notices, timetable, days, todayKey, fmtDate } from "@/data/mock";

export async function askAssistant(q: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 700));
  const s = q.toLowerCase();
  if (s.includes("tomorrow") || s.includes("class")) {
    const idx = days.indexOf(todayKey());
    const day = s.includes("tomorrow") ? days[(idx + 1) % 5] : days[idx];
    const list = timetable.filter((t) => t.day === day);
    return `Here's your schedule for **${day}**:\n` + list.map((t) => `• ${t.start}–${t.end} — ${t.subject} (${t.room}, ${t.faculty})`).join("\n");
  }
  if (s.includes("attendance")) {
    const a = attendance.reduce((x, y) => ({ at: x.at + y.attended, t: x.t + y.total }), { at: 0, t: 0 });
    const low = attendance.filter((x) => x.attended / x.total < 0.8);
    return `Your overall attendance is **${((a.at / a.t) * 100).toFixed(1)}%**.` + (low.length ? `\nBelow 80%: ${low.map((l) => `${l.subject} (${Math.round((l.attended / l.total) * 100)}%)`).join(", ")}.` : " All subjects are above 80%.");
  }
  if (s.includes("notice")) return "Latest notices:\n" + notices.slice(0, 3).map((n) => `• [${n.priority}] ${n.title}`).join("\n");
  if (s.includes("assignment") || s.includes("due")) {
    const p = assignments.filter((a) => a.status === "Pending");
    return `You have ${p.length} pending assignments. Next up: **${p[0].title}** (${p[0].subject}), due ${fmtDate(p[0].due)}.`;
  }
  if (s.includes("event")) return "Events coming up:\n" + events.slice(0, 3).map((e) => `• ${e.title} — ${fmtDate(e.date)}, ${e.venue}`).join("\n");
  if (s.includes("projector") || s.includes("report") || s.includes("broken")) return "You can report it under **Complaints → New complaint**. Choose category *Classroom*, add the room number, and attach a photo if possible. The AV team usually responds within 24 hours.";
  return "I can help with your timetable, attendance, notices, assignments, events, and campus complaints. Try asking “What is my attendance?”";
}
