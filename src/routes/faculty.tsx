import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  BookOpen,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquareWarning,
  User,
} from "lucide-react";
import { PortalShell, type NavItem } from "@/components/campus/PortalShell";
import { currentUserFn } from "@/lib/auth.functions";
import { getFacultyUnreadNotificationCountFn } from "@/lib/campus.functions";

const nav: NavItem[] = [
  { to: "/faculty", label: "Dashboard", icon: LayoutDashboard },
  { to: "/faculty/classes", label: "Classes", icon: BookOpen },
  { to: "/faculty/attendance", label: "Attendance", icon: CheckCircle2 },
  { to: "/faculty/assignments", label: "Assignments", icon: FileText },
  { to: "/faculty/events", label: "Events", icon: CalendarDays },
  { to: "/faculty/notices", label: "Notices", icon: Megaphone },
  { to: "/faculty/issues", label: "Student Issues", icon: MessageSquareWarning },
  { to: "/faculty/notifications", label: "Notifications", icon: Bell },
  { to: "/faculty/profile", label: "Profile", icon: User },
];

export const Route = createFileRoute("/faculty")({
  beforeLoad: async () => {
    const user = await currentUserFn();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "Faculty") {
      throw redirect({ to: user.role === "Admin" ? "/admin" : "/student" });
    }
    const unreadNotificationCount = await getFacultyUnreadNotificationCountFn();
    return { user, unreadNotificationCount };
  },
  component: FacultyLayout,
});

function FacultyLayout() {
  const { user, unreadNotificationCount } = Route.useRouteContext();
  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <PortalShell
      role="Faculty"
      nav={nav}
      notifyTo="/faculty/notifications"
      notificationCount={unreadNotificationCount}
      user={{ name: user.name, initials, sub: "Faculty" }}
    />
  );
}
