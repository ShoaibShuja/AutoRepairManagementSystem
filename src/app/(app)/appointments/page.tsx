/* eslint-disable @typescript-eslint/no-explicit-any -- nested Supabase relations are unknown until types are regenerated after reset. */
import Link from "next/link";
import { addDays, format, isValid, startOfDay, subDays } from "date-fns";
import { EmptyState, PageHeader, StatusBadge } from "@/components/operational";
import { AppointmentForm } from "@/features/appointments/appointment-form";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

const appointmentStatuses = ["scheduled", "checked_in", "in_progress", "completed", "cancelled", "no_show"];
const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kabul",
  hour: "numeric",
  minute: "2-digit",
});

function toBadgeStatus(status: string) {
  if (status === "cancelled" || status === "no_show") return "cancelled";
  if (status === "completed") return "completed";
  return status === "scheduled" ? "scheduled" : "pending";
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string; create?: string }>;
}) {
  const staff = await requireRole(["admin", "front_desk"]);
  const params = await searchParams;
  const requestedDate = params.date ? new Date(`${params.date}T00:00:00`) : new Date();
  const selected = isValid(requestedDate) ? requestedDate : new Date();
  const start = startOfDay(selected);
  const selectedDate = format(selected, "yyyy-MM-dd");
  const selectedStatus = appointmentStatuses.includes(params.status ?? "") ? params.status : "";
  const supabase = await createClient();
  let appointmentsQuery = supabase
    .from("appointments")
    .select(
      "id,requested_service_summary,starts_at,ends_at,status,customers(full_name),vehicles(plate_number,make,model),profiles!appointments_assigned_technician_id_fkey(display_name)",
    )
    .gte("starts_at", start.toISOString())
    .lt("starts_at", addDays(start, 1).toISOString())
    .order("starts_at");
  if (selectedStatus) appointmentsQuery = appointmentsQuery.eq("status", selectedStatus);
  const [
    { data: appointments, error },
    { data: customers },
    { data: vehicles },
    { data: services },
    { data: technicians },
  ] = await Promise.all([
    appointmentsQuery,
    supabase.from("customers").select("id,full_name,phone").is("archived_at", null).order("full_name"),
    supabase.from("vehicles").select("id,customer_id,plate_number,make,model").is("archived_at", null),
    supabase.from("service_catalog").select("id,name").is("archived_at", null).order("name"),
    supabase
      .from("profiles")
      .select("id,display_name")
      .eq("role", "technician")
      .eq("account_status", "active")
      .order("display_name"),
  ]);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Scheduling"
        title="Appointments"
        description="Manage one day at a time. Open an appointment to update its time, assignment, or status."
        actions={
          <Link
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground"
            href={`/appointments?date=${selectedDate}&create=1`}
          >
            New appointment
          </Link>
        }
      />
      <form className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
        <div className="flex gap-2">
          <Link
            className="rounded-md border px-3 py-2 text-sm font-medium"
            href={`/appointments?date=${format(subDays(selected, 1), "yyyy-MM-dd")}`}
          >
            Previous
          </Link>
          <Link className="rounded-md border px-3 py-2 text-sm font-medium" href="/appointments">
            Today
          </Link>
          <Link
            className="rounded-md border px-3 py-2 text-sm font-medium"
            href={`/appointments?date=${format(addDays(selected, 1), "yyyy-MM-dd")}`}
          >
            Next
          </Link>
        </div>
        <label>
          <span className="sr-only">Schedule date</span>
          <input
            className="h-10 w-full rounded-md border bg-background px-3"
            defaultValue={selectedDate}
            name="date"
            type="date"
          />
        </label>
        <select
          className="h-10 rounded-md border bg-background px-3"
          defaultValue={selectedStatus}
          name="status"
        >
          <option value="">All statuses</option>
          {appointmentStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground">
          View schedule
        </button>
      </form>
      {params.create === "1" ? (
        <AppointmentForm
          admin={staff.role === "admin"}
          customers={(customers ?? []).map((item) => ({
            id: item.id,
            name: item.full_name,
            phone: item.phone,
          }))}
          vehicles={(vehicles ?? []).map((item) => ({
            id: item.id,
            customerId: item.customer_id,
            label: [item.make, item.model].filter(Boolean).join(" ") || "Vehicle",
            plate: item.plate_number,
          }))}
          services={(services ?? []).map((item) => ({ id: item.id, name: item.name }))}
          technicians={(technicians ?? []).map((item) => ({ id: item.id, name: item.display_name }))}
        />
      ) : null}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-semibold tracking-tight">{format(selected, "EEEE, MMMM d")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Times are shown in Asia/Kabul.</p>
          </div>
          <p className="text-sm text-muted-foreground">{appointments?.length ?? 0} scheduled</p>
        </div>
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-card p-5 text-sm text-destructive">
            Appointments could not be loaded. Try refreshing the page.
          </p>
        ) : appointments?.length ? (
          <div className="space-y-3">
            {appointments.map((appointment: any) => (
              <article className="rounded-lg border bg-card p-4 sm:p-5" key={appointment.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <p className="min-w-28 font-semibold tabular-nums">
                      {timeFormat.format(new Date(appointment.starts_at))}
                      <span className="mx-1 text-muted-foreground">to</span>
                      {timeFormat.format(new Date(appointment.ends_at))}
                    </p>
                    <div>
                      <h3 className="font-medium">{appointment.customers?.full_name ?? "Customer"}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {appointment.vehicles?.plate_number ||
                          [appointment.vehicles?.make, appointment.vehicles?.model]
                            .filter(Boolean)
                            .join(" ") ||
                          "Vehicle"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={toBadgeStatus(appointment.status)} />
                    <span className="text-sm text-muted-foreground capitalize">
                      {appointment.status.replaceAll("_", " ")}
                    </span>
                    <Link className="text-sm font-medium underline" href={`/appointments/${appointment.id}`}>
                      Open
                    </Link>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 border-t pt-4 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-foreground">Services:</span>{" "}
                    {appointment.requested_service_summary}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Technician:</span>{" "}
                    {appointment.profiles?.display_name ?? "Unassigned"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No appointments for this day"
            description={
              selectedStatus
                ? "Try another status or choose a different day."
                : "Create an appointment to start this day's schedule."
            }
            action={
              <Link
                className="text-sm font-medium underline"
                href={`/appointments?date=${selectedDate}&create=1`}
              >
                New appointment
              </Link>
            }
          />
        )}
      </section>
    </section>
  );
}
