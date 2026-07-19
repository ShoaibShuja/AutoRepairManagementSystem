import { StaffForm } from "@/features/staff/staff-form";
import { StaffRowActions } from "@/features/staff/staff-row-actions";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function StaffPage() {
  const currentStaff = await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: staff, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, account_status, created_at")
    .order("display_name");

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Administration</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Staff access</h1>
        <p className="mt-2 text-muted-foreground">
          Create staff accounts, assign roles, and deactivate access when it is no longer needed.
        </p>
      </div>
      <StaffForm />
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-5 py-3 text-sm font-medium">Staff directory</div>
        {error ? (
          <p className="p-5 text-sm text-destructive">Staff records could not be loaded.</p>
        ) : (
          <div className="divide-y">
            {staff?.map((member) => (
              <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto]" key={member.id}>
                <div>
                  <p className="font-medium">{member.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.email} · {member.account_status}
                  </p>
                </div>
                <StaffRowActions
                  id={member.id}
                  isCurrentUser={member.id === currentStaff.id}
                  role={member.role}
                  status={member.account_status}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
