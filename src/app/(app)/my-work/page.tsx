/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase nested relation types are unknown until generated after reset. */
import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/operational";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function MyWorkPage() {
  const staff = await requireRole(["technician"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_orders")
    .select(
      "id, public_number, status, intake_notes, estimated_completion_at, vehicles(plate_number, make, model), work_order_services(service_name_snapshot)",
    )
    .eq("assigned_technician_id", staff.id)
    .in("status", ["assigned", "in_progress", "ready_for_review"])
    .order("estimated_completion_at", { ascending: true, nullsFirst: false });
  const orders = (data ?? []) as any[];
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Technician workspace"
        title="My assigned work"
        description="Only jobs assigned to you are shown. Parts and vehicle photos will be added in the next operational phase."
      />
      {error ? (
        <p className="text-destructive">Assigned work could not be loaded.</p>
      ) : orders.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <article className="rounded-lg border bg-card p-5" key={order.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link className="font-semibold hover:underline" href={`/work-orders/${order.id}`}>
                    WO-{String(order.public_number).padStart(6, "0")}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[order.vehicles?.make, order.vehicles?.model].filter(Boolean).join(" ") || "Vehicle"} ·{" "}
                    {order.vehicles?.plate_number || "No plate"}
                  </p>
                </div>
                <StatusBadge
                  status={
                    order.status === "in_progress" ||
                    order.status === "ready_for_review" ||
                    order.status === "assigned"
                      ? "pending"
                      : "completed"
                  }
                />
              </div>
              <p className="mt-4 text-sm">
                <span className="font-medium">Concern: </span>
                {order.intake_notes || "No concern recorded."}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Services:{" "}
                {order.work_order_services.map((service: any) => service.service_name_snapshot).join(", ")}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {order.estimated_completion_at
                  ? `Estimated completion: ${new Date(order.estimated_completion_at).toLocaleString()}`
                  : "No estimated completion recorded"}
              </p>
              <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                Parts and photos: available in a later phase.
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No assigned work" description="Newly assigned jobs will appear here." />
      )}
    </section>
  );
}
