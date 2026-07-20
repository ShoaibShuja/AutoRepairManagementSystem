/* eslint-disable @typescript-eslint/no-explicit-any -- generated operational relation types follow local reset. */
import { EmptyState, PageHeader, SectionHeader, StatCard } from "@/components/operational/display";
import { requireStaff } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
export default async function DashboardPage() {
  const staff = await requireStaff();
  const db = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const [appointments, active, queued, completed, low, unpaid, revenue] = await Promise.all([
    db
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", today.toISOString())
      .lt("starts_at", tomorrow.toISOString()),
    db.from("work_orders").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    db
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "assigned", "ready_for_review"]),
    db
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", today.toISOString())
      .lt("completed_at", tomorrow.toISOString()),
    db
      .from("parts")
      .select("id", { count: "exact", head: true })
      .filter("quantity_on_hand", "lte", "reorder_threshold")
      .is("archived_at", null),
    db.from("invoices").select("id", { count: "exact", head: true }).eq("status", "issued"),
    staff.role === "technician"
      ? Promise.resolve({ data: null })
      : db
          .from("payments")
          .select("amount_minor")
          .gte("received_at", today.toISOString())
          .lt("received_at", tomorrow.toISOString()),
  ]);
  const dailyRevenue = (revenue.data ?? []).reduce(
    (sum: number, row: any) => sum + Number(row.amount_minor),
    0,
  );
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow={`Signed in as ${staff.role.replace("_", " ")}`}
        title="Operations workspace"
        description="Live operational counts for the current business day."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's appointments" value={String(appointments.count ?? 0)} />
        <StatCard label="Jobs in progress" value={String(active.count ?? 0)} />
        <StatCard label="Waiting or queued" value={String(queued.count ?? 0)} />
        <StatCard label="Low-stock parts" value={String(low.count ?? 0)} />
        <StatCard label="Completed today" value={String(completed.count ?? 0)} />
        {staff.role !== "technician" ? (
          <>
            <StatCard label="Collected today" value={dailyRevenue.toLocaleString()} />
            <StatCard label="Unpaid invoices" value={String(unpaid.count ?? 0)} />
          </>
        ) : null}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-4">
          <SectionHeader
            title="Daily operations"
            description="Counts update from operational records; no sample metrics are shown."
          />
          <EmptyState
            title="Open appointments"
            description="Use the appointments calendar to review and reschedule today’s visits."
          />
        </section>
        <section className="space-y-4">
          <SectionHeader
            title="Operational follow-up"
            description="Use inventory and work orders to resolve stock and job queues."
          />
          <EmptyState
            title="No alert feed yet"
            description="Low-stock and queue counts above are based on current database records."
          />
        </section>
      </div>
    </section>
  );
}
