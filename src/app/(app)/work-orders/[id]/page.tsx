/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase nested relation types are unknown until generated after reset. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { CurrencyDisplay, EmptyState, PageHeader, StatusBadge } from "@/components/operational";
import { addTechnicianNoteForm, transitionWorkOrder } from "@/features/work-orders/actions";
import { WorkOrderForm } from "@/features/work-orders/work-order-form";
import { canTransitionWorkOrder } from "@/features/work-orders/validation";
import { requireStaff } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

const nextStatuses = ["assigned", "in_progress", "ready_for_review", "completed", "invoiced", "cancelled"];

export default async function WorkOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase.from("work_orders").select("id, public_number, customer_id, vehicle_id, assigned_technician_id, status, intake_notes, technical_notes, estimated_completion_at, reported_mileage, customers(full_name, phone), vehicles(plate_number, make, model, model_year, mileage), work_order_services(id, service_catalog_id, service_name_snapshot, service_description_snapshot, unit_price_minor, quantity)").eq("id", id).maybeSingle();
  if (!order) notFound();
  const typed = order as any;
  const { data: activityRows } = await supabase.from("activity_log").select("id, action, after_data, created_at").eq("entity_type", "work_order").eq("entity_id", id).order("created_at", { ascending: false });
  const activity = (activityRows ?? []) as Array<{ id: string; action: string; created_at: string }>;
  const canEdit = staff.role !== "technician" && ["draft", "assigned"].includes(typed.status);
  const inputs = canEdit ? await Promise.all([supabase.from("customers").select("id, full_name, phone").is("archived_at", null), supabase.from("vehicles").select("id, customer_id, plate_number, make, model").is("archived_at", null), supabase.from("service_catalog").select("id,name,description,standard_price_minor").is("archived_at", null), supabase.from("profiles").select("id,display_name").eq("role", "technician").eq("account_status", "active")]) : null;
  const total = typed.work_order_services.reduce((sum: number, service: any) => sum + service.unit_price_minor * Number(service.quantity), 0);
  const badge = typed.status === "cancelled" ? "cancelled" : ["completed", "invoiced"].includes(typed.status) ? "completed" : "pending";
  return <section className="space-y-8">
    <PageHeader eyebrow="Work order" title={`WO-${String(typed.public_number).padStart(6, "0")}`} description={`${typed.customers?.full_name ?? "Customer"} · ${typed.vehicles?.plate_number ?? "Vehicle"}`} actions={<StatusBadge status={badge} />} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <section className="rounded-lg border bg-card p-5"><h2 className="font-semibold">Customer concern</h2><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{typed.intake_notes || "No concern recorded."}</p><h2 className="mt-5 font-semibold">Services</h2><ul className="mt-2 space-y-2">{typed.work_order_services.map((service: any) => <li className="rounded-md border p-3" key={service.id}><div className="flex justify-between gap-3"><span className="font-medium">{service.service_name_snapshot}</span><CurrencyDisplay amount={service.unit_price_minor * Number(service.quantity)} /></div><p className="mt-1 text-sm text-muted-foreground">{service.service_description_snapshot || "No description"}</p></li>)}</ul><p className="mt-3 text-right font-semibold">Total: <CurrencyDisplay amount={total} /></p></section>
        {canEdit && inputs ? <WorkOrderForm customers={(inputs[0].data ?? []).map((item) => ({ id:item.id, fullName:item.full_name, phone:item.phone }))} vehicles={(inputs[1].data ?? []).map((item) => ({ id:item.id, customerId:item.customer_id, label:[item.make,item.model].filter(Boolean).join(" ") || "Vehicle", plate:item.plate_number }))} services={(inputs[2].data ?? []).map((item) => ({ id:item.id, name:item.name, description:item.description, price:item.standard_price_minor }))} technicians={(inputs[3].data ?? []).map((item) => ({ id:item.id,name:item.display_name }))} workOrder={{ id:typed.id, customerId:typed.customer_id, vehicleId:typed.vehicle_id, technicianId:typed.assigned_technician_id, concern:typed.intake_notes, internalNotes:typed.technical_notes, estimatedCompletionAt:typed.estimated_completion_at, mileage:typed.reported_mileage, serviceIds:typed.work_order_services.map((service:any) => service.service_catalog_id).filter(Boolean) }} /> : null}
        {staff.role === "technician" ? <TechnicianNoteForm workOrderId={typed.id} /> : null}
      </div>
      <aside className="space-y-5"><section className="rounded-lg border bg-card p-5"><h2 className="font-semibold">Work details</h2><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-muted-foreground">Vehicle</dt><dd>{[typed.vehicles?.model_year,typed.vehicles?.make,typed.vehicles?.model].filter(Boolean).join(" ") || typed.vehicles?.plate_number}</dd></div><div><dt className="text-muted-foreground">Mileage</dt><dd>{typed.reported_mileage?.toLocaleString() ?? typed.vehicles?.mileage?.toLocaleString() ?? "Not recorded"}</dd></div><div><dt className="text-muted-foreground">Estimate</dt><dd>{typed.estimated_completion_at ? new Date(typed.estimated_completion_at).toLocaleString() : "Not recorded"}</dd></div></dl></section><section className="rounded-lg border bg-card p-5"><h2 className="font-semibold">Actions</h2>{nextStatuses.filter((next) => canTransitionWorkOrder(staff.role, typed.status, next)).map((next) => <form action={transitionWorkOrder} className="mt-3" key={next}><input name="workOrderId" type="hidden" value={typed.id}/><input name="vehicleId" type="hidden" value={typed.vehicle_id}/><input name="nextStatus" type="hidden" value={next}/>{next === "cancelled" ? <input className="mb-2 h-9 w-full rounded-md border px-2 text-sm" name="note" placeholder="Cancellation reason" required /> : null}<button className="w-full rounded-md border px-3 py-2 text-sm font-medium capitalize">Mark {next.replaceAll("_", " ")}</button></form>)}</section><section><h2 className="font-semibold">Activity</h2>{activity?.length ? <ol className="mt-3 space-y-3 border-l pl-4 text-sm">{activity.map((event) => <li key={event.id}><p className="font-medium capitalize">{event.action.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p></li>)}</ol> : <EmptyState title="No activity yet" description="Important work-order events will appear here." />}</section>{staff.role !== "technician" ? <Link className="text-sm font-medium underline" href={`/vehicles/${typed.vehicle_id}`}>View full vehicle history</Link> : null}</aside>
    </div>
  </section>;
}
function TechnicianNoteForm({ workOrderId }: { workOrderId: string }) { return <form action={addTechnicianNoteForm} className="rounded-lg border bg-card p-5"><input name="workOrderId" type="hidden" value={workOrderId}/><label className="text-sm font-medium">Technical note<textarea className="mt-2 min-h-24 w-full rounded-md border bg-background p-3" name="note" required /></label><button className="mt-3 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground">Add note</button></form>; }
