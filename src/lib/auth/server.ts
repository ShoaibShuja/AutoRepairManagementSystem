import { cache } from "react";
import { redirect } from "next/navigation";

import { canAccessStaffWorkspace, hasAnyRole, type StaffRole } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export const getCurrentStaff = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !canAccessStaffWorkspace(profile.role, profile.account_status)) return null;
  return profile;
});

export async function requireStaff() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?reason=access");
  return staff;
}

export async function requireRole(allowedRoles: readonly StaffRole[]) {
  const staff = await requireStaff();
  if (!hasAnyRole(staff.role, allowedRoles)) redirect("/access-denied");
  return staff;
}
