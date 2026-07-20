"use client";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormSection, ServerError } from "@/components/operational";
import { saveAppointment, type AppointmentActionState } from "./actions";
type Customer = { id: string; name: string; phone: string | null };
type Vehicle = { id: string; customerId: string; label: string; plate: string | null };
type Service = { id: string; name: string };
type Technician = { id: string; name: string };
type Initial = {
  id: string;
  customerId: string;
  vehicleId: string;
  technicianId: string | null;
  startsAt: string;
  endsAt: string;
  notes: string | null;
  revision: number;
  serviceIds: string[];
};
export function AppointmentForm({
  customers,
  vehicles,
  services,
  technicians,
  appointment,
  admin,
}: {
  customers: Customer[];
  vehicles: Vehicle[];
  services: Service[];
  technicians: Technician[];
  appointment?: Initial;
  admin: boolean;
}) {
  const [customerId, setCustomerId] = useState(appointment?.customerId ?? "");
  const choices = useMemo(
    () => vehicles.filter((vehicle) => vehicle.customerId === customerId),
    [customerId, vehicles],
  );
  const [state, action, pending] = useActionState(saveAppointment, {} as AppointmentActionState);
  return (
    <form action={action} className="space-y-5">
      {appointment ? (
        <>
          <input name="appointmentId" type="hidden" value={appointment.id} />
          <input name="revision" type="hidden" value={appointment.revision} />
        </>
      ) : null}
      <FormSection
        title={appointment ? "Appointment details" : "New appointment"}
        description="Times are displayed and stored for the shop's Asia/Kabul business timezone."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Customer *
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={customerId}
              name="customerId"
              onChange={(event) => setCustomerId(event.target.value)}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.phone ? ` (${customer.phone})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Vehicle *
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={appointment?.vehicleId ?? ""}
              key={customerId}
              name="vehicleId"
              required
            >
              <option value="">Select vehicle</option>
              {choices.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label}
                  {vehicle.plate ? ` · ${vehicle.plate}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Technician
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={appointment?.technicianId ?? ""}
              name="technicianId"
            >
              <option value="">Unassigned</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Start *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={appointment?.startsAt.slice(0, 16)}
              name="startsAt"
              type="datetime-local"
              required
            />
          </label>
          <label className="text-sm font-medium">
            End *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={appointment?.endsAt.slice(0, 16)}
              name="endsAt"
              type="datetime-local"
              required
            />
          </label>
          <label className="text-sm font-medium md:col-span-2">
            Notes
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border bg-background p-3"
              defaultValue={appointment?.notes ?? ""}
              name="notes"
            />
          </label>
        </div>
      </FormSection>
      <FormSection
        title="Requested services"
        description="These services will be copied to a work order if the appointment is converted."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((service) => (
            <label className="flex gap-2 rounded-md border p-3 text-sm" key={service.id}>
              <input
                defaultChecked={appointment?.serviceIds.includes(service.id)}
                name="serviceIds"
                type="checkbox"
                value={service.id}
              />
              {service.name}
            </label>
          ))}
        </div>
        {admin ? (
          <label className="mt-4 flex gap-2 text-sm">
            <input name="overrideConflict" type="checkbox" value="true" />
            Override an overlapping technician appointment
          </label>
        ) : null}
      </FormSection>
      <ServerError message={state.error} />
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
      <Button disabled={pending}>{pending ? "Saving…" : "Save appointment"}</Button>
    </form>
  );
}
