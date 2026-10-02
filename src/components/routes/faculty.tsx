import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, FileText, LayoutDashboard, Megaphone, MessageSquareWarning, User } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/campus/PortalShell";
import { currentFaculty } from "@/data/mock";

const nav: NavItem[] = [
  { to: "/faculty", label: "Dashboard", icon: LayoutDashboard },
  { to: "/faculty/classes", label: "Classes", icon: BookOpen },
  { to: "/faculty/attendance", label: "Attendance", icon: CheckCircle2 },
  { to: "/faculty/assignments", label: "Assignments", icon: FileText },
  { to: "/faculty/notices", label: "Notices", icon: Megaphone },
  { to: "/faculty/issues", label: "Student Issues", icon: MessageSquareWarning },
  { to: "/faculty/profile", label: "Profile", icon: User },
];

export const Route = createFileRoute("/faculty")({
  component: () => (
    <PortalShell role="Faculty" nav={nav} user={{ name: currentFaculty.name, initials: currentFaculty.initials, sub: currentFaculty.designation }} />
  ),
});
