/* eslint-disable @typescript-eslint/no-explicit-any -- generated types are refreshed after local reset. */
import { EmptyState, PageHeader } from "@/components/operational";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRole(["admin", "front_desk"]);
  const p = await searchParams;
  const from = p.from ? new Date(`${p.from}T00:00:00Z`) : new Date("2020-01-01T00:00:00Z");
  const to = p.to ? new Date(`${p.to}T23:59:59Z`) : new Date("2100-01-01T00:00:00Z");
  const db = await createClient();
  const [{ data: payments }, { data: orders }, { data: services }] = await Promise.all([
    db
      .from("payments")
      .select("amount_minor,received_at")
      .gte("received_at", from.toISOString())
      .lte("received_at", to.toISOString()),
    db
      .from("work_orders")
      .select("assigned_technician_id,status")
      .gte("completed_at", from.toISOString())
      .lte("completed_at", to.toISOString()),
    db
      .from("work_order_services")
      .select("service_name_snapshot,quantity,work_orders!inner(completed_at)")
      .gte("work_orders.completed_at", from.toISOString())
      .lte("work_orders.completed_at", to.toISOString()),
  ]);
  const revenue = (payments ?? []).reduce((sum: number, row: any) => sum + Number(row.amount_minor), 0);
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="Essential operations"
        description="Revenue is collected offline payments in the selected date range. Service and technician counts use completed work orders."
      />
      <form className="flex flex-wrap gap-2 rounded-lg border bg-card p-3">
        <input defaultValue={p.from ?? ""} name="from" type="date" />
        <input defaultValue={p.to ?? ""} name="to" type="date" />
        <button className="rounded border px-3">Apply</button>
      </form>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border p-4">
          <p className="text-sm text-muted-foreground">Collected revenue</p>
          <p className="text-2xl font-semibold">{revenue.toLocaleString()}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-muted-foreground">Completed jobs</p>
          <p className="text-2xl font-semibold">
            {
              (orders ?? []).filter((row: any) => row.status === "completed" || row.status === "invoiced")
                .length
            }
          </p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-muted-foreground">Requested services</p>
          <p className="text-2xl font-semibold">{(services ?? []).length}</p>
        </div>
      </div>
      {services?.length ? (
        <table className="w-full rounded border text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left">Service</th>
              <th className="p-3 text-left">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(
              (services as any[]).reduce(
                (acc: Record<string, number>, row) => ({
                  ...acc,
                  [row.service_name_snapshot]: (acc[row.service_name_snapshot] ?? 0) + Number(row.quantity),
                }),
                {},
              ),
            ).map(([name, quantity]) => (
              <tr className="border-t" key={name}>
                <td className="p-3">{name}</td>
                <td className="p-3">{Number(quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState
          title="No report data"
          description="No collected payments or completed work match this date range."
        />
      )}
    </section>
  );
}
