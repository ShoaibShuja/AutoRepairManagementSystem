"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormSection, ServerError } from "@/components/operational";
import { createWorkOrder, updateWorkOrder, type WorkOrderActionState } from "./actions";

type Customer = { id: string; fullName: string; phone: string | null };
type Vehicle = { id: string; customerId: string; label: string; plate: string | null };
type Service = { id: string; name: string; price: number; description: string | null };
type Technician = { id: string; name: string };
type Initial = { id: string; customerId: string; vehicleId: string; technicianId: string | null; concern: string | null; internalNotes: string | null; estimatedCompletionAt: string | null; mileage: number | null; serviceIds: string[] };
export function WorkOrderForm({ customers, vehicles, services, technicians, workOrder }: { customers: Customer[]; vehicles: Vehicle[]; services: Service[]; technicians: Technician[]; workOrder?: Initial }) {
  const [customerId, setCustomerId] = useState(workOrder?.customerId ?? "");
  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.customerId === customerId), [customerId, vehicles]);
  const [state, action, pending] = useActionState(workOrder ? updateWorkOrder : createWorkOrder, {} as WorkOrderActionState);
  return <form action={action} className="space-y-5">
    {workOrder ? <input name="workOrderId" type="hidden" value={workOrder.id} /> : null}
    <FormSection title={workOrder ? "Work-order details" : "New work order"} description="Catalog prices are copied into this order. Price adjustments are not available in this phase.">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Customer *<select className="mt-1 h-10 w-full rounded-md border bg-background px-3" defaultValue={customerId} name="customerId" onChange={(event) => setCustomerId(event.target.value)} required><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName}{customer.phone ? ` (${customer.phone})` : ""}</option>)}</select></label>
        <label className="text-sm font-medium">Vehicle *<select className="mt-1 h-10 w-full rounded-md border bg-background px-3" defaultValue={workOrder?.vehicleId ?? ""} key={customerId} name="vehicleId" required><option value="">Select a vehicle</option>{filteredVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}{vehicle.plate ? ` · ${vehicle.plate}` : ""}</option>)}</select></label>
        <label className="text-sm font-medium">Assigned technician<select className="mt-1 h-10 w-full rounded-md border bg-background px-3" defaultValue={workOrder?.technicianId ?? ""} name="technicianId"><option value="">Unassigned</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}</select></label>
        <label className="text-sm font-medium">Estimated completion<input className="mt-1 h-10 w-full rounded-md border bg-background px-3" defaultValue={workOrder?.estimatedCompletionAt?.slice(0, 16) ?? ""} name="estimatedCompletionAt" type="datetime-local" /></label>
        <label className="text-sm font-medium">Recorded mileage<input className="mt-1 h-10 w-full rounded-md border bg-background px-3" defaultValue={workOrder?.mileage ?? ""} min="0" name="mileage" type="number" /></label>
        <label className="text-sm font-medium md:col-span-2">Customer-reported concern<textarea className="mt-1 min-h-24 w-full rounded-md border bg-background p-3" defaultValue={workOrder?.concern ?? ""} name="concern" /></label>
        <label className="text-sm font-medium md:col-span-2">Internal notes<textarea className="mt-1 min-h-24 w-full rounded-md border bg-background p-3" defaultValue={workOrder?.internalNotes ?? ""} name="internalNotes" /></label>
      </div>
    </FormSection>
    <FormSection title="Services" description="Select one or more active catalog services. Saved name, description, and price stay attached to this work order.">
      <div className="grid gap-2 sm:grid-cols-2">{services.map((service) => <label className="flex gap-3 rounded-md border p-3 text-sm" key={service.id}><input defaultChecked={workOrder?.serviceIds.includes(service.id)} name="serviceIds" type="checkbox" value={service.id} /><span><span className="block font-medium">{service.name} · {service.price}</span><span className="text-muted-foreground">{service.description || "No description"}</span></span></label>)}</div>
    </FormSection>
    <ServerError message={state.error} />{state.message ? <p className="text-sm text-success" role="status">{state.message}</p> : null}
    <Button disabled={pending}>{pending ? "Saving…" : workOrder ? "Save work order" : "Create work order"}</Button>
  </form>;
}
