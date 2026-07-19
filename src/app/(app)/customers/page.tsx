import Link from "next/link";
import { CustomerForm } from "@/features/crm/customer-form";
import { EmptyState, PageHeader } from "@/components/operational";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await requireRole(["admin", "front_desk"]);
  const query = (await searchParams).q?.toString().trim() ?? "";
  const supabase = await createClient();
  let request = supabase
    .from("customers")
    .select("id, full_name, phone, email, archived_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(25);
  if (query)
    request = request.or(
      `name_normalized.ilike.%${query.toLowerCase()}%,phone_normalized.ilike.%${query.replace(/[^0-9+]/g, "")}%`,
    );
  const { data, error } = await request;
  const customers = (data ?? []) as Array<{
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    archived_at: string | null;
    updated_at: string;
  }>;
  return (
    <section className="space-y-8">
      <PageHeader
        title="Customers"
        description="Search customer names or phone numbers, then open a record to manage vehicles and notes."
      />
      <form className="flex gap-2">
        <input
          className="h-10 w-full max-w-md rounded-md border bg-background px-3"
          defaultValue={query}
          name="q"
          placeholder="Search name or phone"
        />
        <button className="rounded-md bg-brand-primary px-4 text-sm font-medium text-brand-primary-foreground">
          Search
        </button>
      </form>
      <CustomerForm />
      {error ? (
        <p className="text-destructive">Customers could not be loaded.</p>
      ) : customers.length ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          {customers.map((customer) => (
            <Link
              className="block border-b p-4 last:border-b-0 hover:bg-muted"
              href={`/customers/${customer.id}`}
              key={customer.id}
            >
              <p className="font-medium">{customer.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {customer.phone ?? customer.email ?? "No contact information"}
                {customer.archived_at ? " · Archived" : ""}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No customers found"
          description="Create a customer record or adjust your search."
        />
      )}
    </section>
  );
}
