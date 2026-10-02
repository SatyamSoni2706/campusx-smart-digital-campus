import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  PackageSearch,
  Settings,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";
import { PortalShell, type NavItem } from "@/components/campus/PortalShell";
import { currentUserFn } from "@/lib/auth.functions";

const nav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/students", label: "Students", icon: GraduationCap },
  { to: "/admin/faculty", label: "Faculty", icon: Users },
  { to: "/admin/notices", label: "Notices", icon: Megaphone },
  { to: "/admin/events", label: "Events", icon: Ticket },
  { to: "/admin/complaints", label: "Complaints", icon: Wrench },
  { to: "/admin/lost-found", label: "Lost & Found", icon: PackageSearch },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/services", label: "Campus Services", icon: Building2 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = await currentUserFn();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "Admin")
      throw redirect({ to: user.role === "Student" ? "/student" : "/login" });
    return { user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <PortalShell
      role="Admin"
      nav={nav}
      user={{ name: user.name, initials, sub: "Administrator" }}
    />
  );
}
