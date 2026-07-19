import type { LucideIcon } from "lucide-react";
import { CarFront, LayoutDashboard, ListChecks, UsersRound } from "lucide-react";
import type { StaffRole } from "@/lib/auth/permissions";

export type NavigationItem = { href: string; icon: LucideIcon; label: string; roles: readonly StaffRole[] };
const navigation: readonly NavigationItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["admin", "front_desk", "technician"],
  },
  { href: "/customers", icon: CarFront, label: "Customers", roles: ["admin", "front_desk"] },
  { href: "/services", icon: ListChecks, label: "Services", roles: ["admin", "front_desk"] },
  { href: "/staff", icon: UsersRound, label: "Staff", roles: ["admin"] },
];
export function getNavigationForRole(role: StaffRole) {
  return navigation.filter((item) => item.roles.includes(role));
}
export function getBreadcrumb(pathname: string) {
  const item = navigation.find((entry) => entry.href === pathname);
  return item ? ["Workspace", item.label] : ["Workspace"];
}
