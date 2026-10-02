import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Megaphone,
  PackageSearch,
  Sparkles,
  Ticket,
  User,
  Wrench,
} from "lucide-react";
import { PortalShell, type NavItem } from "@/components/campus/PortalShell";
import { currentStudent } from "@/data/mock";
import { currentUserFn } from "@/lib/auth.functions";

const nav: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/student/attendance", label: "Attendance", icon: CheckCircle2 },
  { to: "/student/notices", label: "Notices", icon: Megaphone },
  { to: "/student/events", label: "Events", icon: Ticket },
  { to: "/student/assignments", label: "Assignments", icon: FileText },
  { to: "/student/complaints", label: "Complaints", icon: Wrench },
  { to: "/student/lost-found", label: "Lost & Found", icon: PackageSearch },
  { to: "/student/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/student/notifications", label: "Notifications", icon: Bell },
  { to: "/student/profile", label: "Profile", icon: User },
];

export const Route = createFileRoute("/student")({
  beforeLoad: async () => {
    const user = await currentUserFn();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "Student")
      throw redirect({ to: user.role === "Admin" ? "/admin" : "/faculty" });
  },
  component: () => (
    <PortalShell
      role="Student"
      nav={nav}
      notifyTo="/student/notifications"
      user={{
        name: currentStudent.name,
        initials: currentStudent.initials,
        sub: `CSE · Sem ${currentStudent.semester}`,
      }}
    />
  ),
});
