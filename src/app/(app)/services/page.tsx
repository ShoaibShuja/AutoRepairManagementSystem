import { CurrencyDisplay, EmptyState, PageHeader, StatusBadge } from "@/components/operational";
import { setServiceArchived } from "@/features/crm/actions";
import { ServiceForm } from "@/features/crm/service-form";
import { requireStaff } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  const staff = await requireStaff();
  const filters = await searchParams;
  const query = filters.q?.trim() ?? "";
  const supabase = await createClient();
  let request = supabase
    .from("service_catalog")
    .select("id, name, category, standard_price_minor, default_duration_minutes, description, archived_at")
    .order("name");
  if (query) request = request.ilike("name_normalized", `%${query.toLowerCase()}%`);
  if (filters.category) request = request.eq("category", filters.category);
  if (filters.status === "active") request = request.is("archived_at", null);
  if (filters.status === "archived") request = request.not("archived_at", "is", null);
  const { data, error } = await request;
  const services = (data ?? []) as Array<{
    id: string;
    name: string;
    category: string | null;
    standard_price_minor: number;
    default_duration_minutes: number;
    description: string | null;
    archived_at: string | null;
  }>;
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Service catalog"
        title="Services"
        description={
          staff.role === "admin"
            ? "Manage prices and durations. Existing work orders always keep their saved service snapshots."
            : "Browse active standard services for future work orders."
        }
      />
      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          className="h-10 rounded-md border bg-background px-3"
          defaultValue={query}
          name="q"
          placeholder="Search services"
        />
        <select
          className="h-10 rounded-md border bg-background px-3"
          defaultValue={filters.category ?? ""}
          name="category"
        >
          <option value="">All categories</option>
          <option value="wash">Wash</option>
          <option value="maintenance">Maintenance</option>
          <option value="repair">Repair</option>
        </select>
        <select
          className="h-10 rounded-md border bg-background px-3"
          defaultValue={filters.status ?? "active"}
          name="status"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="">All statuses</option>
        </select>
        <button className="rounded-md bg-brand-primary px-4 text-sm font-medium text-brand-primary-foreground">
          Filter
        </button>
      </form>
      {staff.role === "admin" ? <ServiceForm /> : null}
      {error ? (
        <p className="text-destructive">Services could not be loaded.</p>
      ) : services.length ? (
        <div className="space-y-3">
          {services.map((service) => (
            <details className="rounded-lg border bg-card p-4" key={service.id}>
              <summary className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.category ?? "Uncategorized"} · {service.default_duration_minutes} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    <CurrencyDisplay amount={service.standard_price_minor} />
                  </p>
                  {service.archived_at ? <StatusBadge status="inactive" /> : <StatusBadge status="active" />}
                </div>
              </summary>
              <p className="mt-4 text-sm text-muted-foreground">
                {service.description || "No additional notes."}
              </p>
              {staff.role === "admin" ? (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <ServiceForm
                    service={{
                      id: service.id,
                      name: service.name,
                      category: service.category,
                      standardPriceMinor: service.standard_price_minor,
                      defaultDurationMinutes: service.default_duration_minutes,
                      description: service.description,
                    }}
                  />
                  <form action={setServiceArchived}>
                    <input name="serviceId" type="hidden" value={service.id} />
                    <input name="archived" type="hidden" value={service.archived_at ? "false" : "true"} />
                    <button className="text-sm font-medium text-destructive">
                      {service.archived_at ? "Reactivate service" : "Archive service"}
                    </button>
                  </form>
                </div>
              ) : null}
            </details>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No services found"
          description="An administrator can add a catalog service or you can adjust the filters."
        />
      )}
    </section>
  );
}
