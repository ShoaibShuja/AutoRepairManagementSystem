/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase nested relation types are unknown until generated after reset. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/operational";
import { setVehicleArchived } from "@/features/crm/actions";
import { VehicleForm } from "@/features/crm/vehicle-form";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function VehicleDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "front_desk"]);
  const { id } = await params;
  const supabase = await createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select(
      "id, customer_id, plate_number, make, model, model_year, color, vin, mileage, mileage_recorded_at, notes, archived_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!vehicle) notFound();
  const [{ data: customer }, { data: workOrderRows }] = await Promise.all([
    supabase.from("customers").select("full_name").eq("id", vehicle.customer_id).maybeSingle(),
    supabase
      .from("work_orders")
      .select(
        "id, public_number, status, created_at, completed_at, reported_mileage, intake_notes, work_order_services(service_name_snapshot), profiles!work_orders_assigned_technician_id_fkey(display_name)",
      )
      .eq("vehicle_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const workOrders = (workOrderRows ?? []) as any[];
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow={customer ? `Customer: ${customer.full_name}` : "Vehicle record"}
        title={
          [vehicle.model_year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
          vehicle.plate_number ||
          "Vehicle"
        }
        description={`Plate: ${vehicle.plate_number ?? "not recorded"}${vehicle.mileage != null ? ` · Mileage: ${vehicle.mileage.toLocaleString()}${vehicle.mileage_recorded_at ? ` recorded ${new Date(vehicle.mileage_recorded_at).toLocaleDateString()}` : ""}` : ""}`}
        actions={
          <>
            <Link
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              href={`/customers/${vehicle.customer_id}`}
            >
              View customer
            </Link>
            <form action={setVehicleArchived}>
              <input name="vehicleId" type="hidden" value={vehicle.id} />
              <input name="customerId" type="hidden" value={vehicle.customer_id} />
              <input name="archived" type="hidden" value={vehicle.archived_at ? "false" : "true"} />
              <button className="text-sm font-medium text-destructive">
                {vehicle.archived_at ? "Restore vehicle" : "Archive vehicle"}
              </button>
            </form>
          </>
        }
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <VehicleForm
          vehicle={{
            id: vehicle.id,
            customerId: vehicle.customer_id,
            plateNumber: vehicle.plate_number,
            make: vehicle.make,
            model: vehicle.model,
            modelYear: vehicle.model_year,
            color: vehicle.color,
            vin: vehicle.vin,
            mileage: vehicle.mileage,
            notes: vehicle.notes,
          }}
        />
        <aside>
          <h2 className="font-semibold">Service history</h2>
          {workOrders.length ? (
            <ul className="mt-3 space-y-2">
              {workOrders.map((order) => (
                <li className="rounded-md border bg-card p-3 text-sm" key={order.id}>
                  <Link className="font-medium hover:underline" href={`/work-orders/${order.id}`}>
                    WO-{String(order.public_number).padStart(6, "0")}
                  </Link>
                  <p className="mt-1 capitalize text-muted-foreground">
                    {order.status.replaceAll("_", " ")} ·{" "}
                    {new Date(order.completed_at ?? order.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-1">
                    {order.work_order_services
                      .map((service: any) => service.service_name_snapshot)
                      .join(", ") || "No services"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Technician: {order.profiles?.display_name ?? "Unassigned"}
                    {order.reported_mileage != null
                      ? ` · Mileage: ${order.reported_mileage.toLocaleString()}`
                      : ""}
                  </p>
                  {order.intake_notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">Concern: {order.intake_notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <EmptyState
                title="No service history yet"
                description="Completed work orders for this vehicle will appear here."
              />
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
