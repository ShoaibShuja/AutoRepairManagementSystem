import type { Database } from "@/types/database";

export type StaffRole = Database["public"]["Enums"]["staff_role"];
export type StaffStatus = Database["public"]["Enums"]["staff_account_status"];

export const staffRoles: readonly StaffRole[] = ["admin", "front_desk", "technician"];

export function hasAnyRole(role: StaffRole, allowedRoles: readonly StaffRole[]) {
  return allowedRoles.includes(role);
}

export function canManageStaff(role: StaffRole) {
  return role === "admin";
}

export function canAccessStaffWorkspace(role: StaffRole, status: StaffStatus) {
  return status === "active" && staffRoles.includes(role);
}
