import Link from "next/link";
import { ArrowUpRight, Mail, Phone, UsersRound } from "lucide-react";
import {
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  SearchInput,
  StatusBadge,
} from "@/components/operational";
import { CustomerCreateDialog } from "@/features/crm/customer-create-dialog";
import { customerSearchFilter } from "@/features/crm/search";
import { requireRole } from "@/lib/auth/server";
import { formatRelativeTime } from "@/lib/date";
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
    .select("id, full_name, phone, email, archived_at, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .limit(25);
  const searchFilter = customerSearchFilter(query);
  if (searchFilter) request = request.or(searchFilter);
  if (query && !searchFilter) request = request.eq("id", "00000000-0000-0000-0000-000000000000");
  const { data, error, count } = await request;
  const customers = (data ?? []) as Array<{
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    archived_at: string | null;
    updated_at: string;
  }>;
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Customer directory"
        title="Customers"
        description="Search customer names or phone numbers, then open a record to manage vehicles and notes."
        actions={<CustomerCreateDialog />}
      />
      <FilterBar>
        <form className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput className="h-11" defaultValue={query} name="q" placeholder="Search name or phone" />
          <button className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-brand-primary-foreground shadow-sm transition-opacity hover:opacity-90">
            Search
          </button>
        </form>
      </FilterBar>
      {error ? (
        <p className="text-destructive">Customers could not be loaded.</p>
      ) : customers.length ? (
        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_12px_32px_-24px_color-mix(in_oklab,var(--foreground),transparent_55%)]">
          <div className="flex flex-col gap-3 border-b border-border/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-surface text-brand-surface-foreground">
                <UsersRound aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold tracking-[-0.02em]">Customer records</h2>
                <p className="text-sm text-muted-foreground">
                  Open a customer to manage their vehicles and notes.
                </p>
              </div>
            </div>
            <p className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {count ?? customers.length} shown
            </p>
          </div>
          <DataTable className="hidden rounded-none border-0 shadow-none md:block">
            <thead className="bg-muted/60 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Contact</th>
                <th className="px-6 py-3 font-semibold">Last activity</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">
                  <span className="sr-only">Open record</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {customers.map((customer) => (
                <tr className="group transition-colors hover:bg-brand-surface/45" key={customer.id}>
                  <td className="px-6 py-4">
                    <Link
                      className="font-semibold hover:text-brand-primary focus-visible:text-brand-primary"
                      href={`/customers/${customer.id}`}
                    >
                      {customer.full_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {customer.phone ? (
                        <p className="flex items-center gap-2">
                          <Phone aria-hidden="true" className="size-3.5" />
                          {customer.phone}
                        </p>
                      ) : null}
                      {customer.email ? (
                        <p className="flex items-center gap-2">
                          <Mail aria-hidden="true" className="size-3.5" />
                          {customer.email}
                        </p>
                      ) : null}
                      {!customer.phone && !customer.email ? <span>No contact information</span> : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatRelativeTime(customer.updated_at)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={customer.archived_at ? "inactive" : "active"} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      aria-label={`Open ${customer.full_name}`}
                      className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      href={`/customers/${customer.id}`}
                    >
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <div className="divide-y divide-border/80 md:hidden">
            {customers.map((customer) => (
              <Link
                className="block px-5 py-4 transition-colors hover:bg-brand-surface/45"
                href={`/customers/${customer.id}`}
                key={customer.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{customer.full_name}</p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {customer.phone ? (
                        <p className="flex items-center gap-2">
                          <Phone aria-hidden="true" className="size-3.5" />
                          {customer.phone}
                        </p>
                      ) : null}
                      {customer.email ? (
                        <p className="flex items-center gap-2 truncate">
                          <Mail aria-hidden="true" className="size-3.5 shrink-0" />
                          {customer.email}
                        </p>
                      ) : null}
                      {!customer.phone && !customer.email ? <span>No contact information</span> : null}
                    </div>
                  </div>
                  <StatusBadge status={customer.archived_at ? "inactive" : "active"} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Updated {formatRelativeTime(customer.updated_at)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="No customers found"
          description="Create a customer record or adjust your search."
        />
      )}
    </section>
  );
}
