import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, SectionHeader, StatusBadge } from "@/components/operational";
import { CustomerForm } from "@/features/crm/customer-form";
import { VehicleForm } from "@/features/crm/vehicle-form";
import { setCustomerArchived } from "@/features/crm/actions";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "front_desk"]);
  const { id } = await params;
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name, phone, email, address, notes, archived_at, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (!customer) notFound();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, plate_number, make, model, model_year, archived_at")
    .eq("customer_id", id)
    .order("updated_at", { ascending: false });
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Customer record"
        title={customer.full_name}
        description={`Created ${new Date(customer.created_at).toLocaleDateString()} · Updated ${new Date(customer.updated_at).toLocaleDateString()}`}
        actions={
          <form action={setCustomerArchived}>
            <input name="customerId" type="hidden" value={customer.id} />
            <input name="archived" type="hidden" value={customer.archived_at ? "false" : "true"} />
            <button className="text-sm font-medium text-destructive">
              {customer.archived_at ? "Restore customer" : "Archive customer"}
            </button>
          </form>
        }
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <CustomerForm
          customer={{
            id: customer.id,
            fullName: customer.full_name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            notes: customer.notes,
          }}
        />
        <aside className="space-y-4">
          <SectionHeader title="Vehicles" description="Vehicles linked to this customer." />
          {vehicles?.map((vehicle) => (
            <Link
              className="block rounded-lg border bg-card p-4 hover:bg-muted"
              href={`/vehicles/${vehicle.id}`}
              key={vehicle.id}
            >
              <p className="font-medium">
                {[vehicle.model_year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
                  "Vehicle details pending"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {vehicle.plate_number ?? "No plate number"}
              </p>
              {vehicle.archived_at ? (
                <div className="mt-2">
                  <StatusBadge status="inactive" />
                </div>
              ) : null}
            </Link>
          ))}
          <VehicleForm vehicle={{ customerId: customer.id }} />
        </aside>
      </div>
    </section>
  );
}
