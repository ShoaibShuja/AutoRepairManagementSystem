import Link from "next/link";
import { CurrencyDisplay, EmptyState, PageHeader, StatusBadge } from "@/components/operational";
import { WorkOrderForm } from "@/features/work-orders/work-order-form";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

const pageSize = 20;
type WorkOrderListEntry = {
  id: string;
  public_number: number;
  status: string;
  created_at: string;
  assigned_technician_id: string | null;
  customers: { full_name: string; phone: string | null } | null;
  vehicles: { plate_number: string | null; make: string | null; model: string | null } | null;
  work_order_services: Array<{ unit_price_minor: number; quantity: number }>;
};
export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; technician?: string; page?: string; create?: string }>;
}) {
  await requireRole(["admin", "front_desk"]);
  const filters = await searchParams;
  const supabase = await createClient();
  const page = Math.max(1, Number(filters.page) || 1);
  const from = (page - 1) * pageSize;
  const query = (filters.q?.trim() ?? "").replace(/[%,()]/g, "");
  const normalizedPhoneQuery = query.replace(/[^0-9+]/g, "");
  const normalizedPlateQuery = query.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const [customerMatches, vehicleMatches] = query
    ? await Promise.all([
        supabase
          .from("customers")
          .select("id")
          .or(
            [
              `name_normalized.ilike.%${query.toLowerCase()}%`,
              ...(normalizedPhoneQuery ? [`phone_normalized.ilike.%${normalizedPhoneQuery}%`] : []),
            ].join(","),
          )
          .limit(100),
        normalizedPlateQuery
          ? supabase
              .from("vehicles")
              .select("id")
              .ilike("plate_normalized", `%${normalizedPlateQuery}%`)
              .limit(100)
          : Promise.resolve({ data: [] as Array<{ id: string }> }),
      ])
    : [{ data: [] as Array<{ id: string }> }, { data: [] as Array<{ id: string }> }];
  let request = supabase
    .from("work_orders")
    .select(
      "id, public_number, customer_id, vehicle_id, assigned_technician_id, status, created_at, customers(full_name, phone), vehicles(plate_number, make, model), work_order_services(unit_price_minor, quantity)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (filters.status) request = request.eq("status", filters.status);
  if (filters.technician) request = request.eq("assigned_technician_id", filters.technician);
  if (query) {
    const matchingCustomerIds = (customerMatches.data ?? []).map((item) => item.id);
    const matchingVehicleIds = (vehicleMatches.data ?? []).map((item) => item.id);
    const filtersForQuery = [`public_number.eq.${Number(query) || -1}`];
    if (matchingCustomerIds.length) filtersForQuery.push(`customer_id.in.(${matchingCustomerIds.join(",")})`);
    if (matchingVehicleIds.length) filtersForQuery.push(`vehicle_id.in.(${matchingVehicleIds.join(",")})`);
    request = request.or(filtersForQuery.join(","));
  }
  const { data, count, error } = await request;
  const orders = (data ?? []) as unknown as WorkOrderListEntry[];
  const [{ data: customers }, { data: vehicles }, { data: services }, { data: technicians }] =
    await Promise.all([
      supabase.from("customers").select("id, full_name, phone").is("archived_at", null).order("full_name"),
      supabase
        .from("vehicles")
        .select("id, customer_id, plate_number, make, model")
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("service_catalog")
        .select("id, name, description, standard_price_minor")
        .is("archived_at", null)
        .order("name"),
      supabase
        .from("profiles")
        .select("id, display_name")
        .eq("role", "technician")
        .eq("account_status", "active")
        .order("display_name"),
    ]);
  const visibleOrders = orders;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Work orders"
        description="Create, assign, and track workshop work. Service prices are captured when an order is created."
        actions={
          <Link
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground"
            href="/work-orders?create=1"
          >
            New work order
          </Link>
        }
      />
      <form className="grid gap-2 rounded-lg border bg-card p-3 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          className="h-10 rounded-md border bg-background px-3"
          defaultValue={filters.q ?? ""}
          name="q"
          placeholder="Number, customer, phone, or plate"
        />
        <select
          className="h-10 rounded-md border bg-background px-3"
          defaultValue={filters.status ?? ""}
          name="status"
        >
          <option value="">All statuses</option>
          {["draft", "assigned", "in_progress", "ready_for_review", "completed", "invoiced", "cancelled"].map(
            (status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ),
          )}
        </select>
        <select
          className="h-10 rounded-md border bg-background px-3"
          defaultValue={filters.technician ?? ""}
          name="technician"
        >
          <option value="">All technicians</option>
          {(technicians ?? []).map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.display_name}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-brand-primary px-4 text-sm font-medium text-brand-primary-foreground">
          Filter
        </button>
      </form>
      {filters.create === "1" ? (
        <WorkOrderForm
          customers={(customers ?? []).map((item) => ({
            id: item.id,
            fullName: item.full_name,
            phone: item.phone,
          }))}
          vehicles={(vehicles ?? []).map((item) => ({
            id: item.id,
            customerId: item.customer_id,
            label: [item.make, item.model].filter(Boolean).join(" ") || "Vehicle",
            plate: item.plate_number,
          }))}
          services={(services ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.standard_price_minor,
          }))}
          technicians={(technicians ?? []).map((item) => ({ id: item.id, name: item.display_name }))}
        />
      ) : null}
      {error ? (
        <p className="text-destructive">Work orders could not be loaded.</p>
      ) : visibleOrders.length ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3">Order</th>
                <th className="p-3">Customer / vehicle</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr className="border-b last:border-0" key={order.id}>
                  <td className="p-3">
                    <Link className="font-medium hover:underline" href={`/work-orders/${order.id}`}>
                      WO-{String(order.public_number).padStart(6, "0")}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="p-3">
                    {order.customers?.full_name}
                    <p className="text-xs text-muted-foreground">
                      {order.vehicles?.plate_number ||
                        [order.vehicles?.make, order.vehicles?.model].filter(Boolean).join(" ")}
                    </p>
                  </td>
                  <td className="p-3">
                    <StatusBadge
                      status={
                        order.status === "in_progress" ||
                        order.status === "ready_for_review" ||
                        order.status === "assigned" ||
                        order.status === "draft"
                          ? "pending"
                          : order.status === "cancelled"
                            ? "cancelled"
                            : "completed"
                      }
                    />
                  </td>
                  <td className="p-3 text-right">
                    <CurrencyDisplay
                      amount={order.work_order_services.reduce(
                        (sum, service) => sum + service.unit_price_minor * Number(service.quantity),
                        0,
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No work orders found"
          description="Create a work order or adjust the current filters."
        />
      )}
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Link
          className="text-sm font-medium underline"
          href={`/work-orders?${new URLSearchParams({ ...filters, page: String(page + 1) })}`}
        >
          Next page
        </Link>
      ) : null}
    </section>
  );
}
