"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormSection, ServerError } from "@/components/operational";
import { createVehicle, updateVehicle, type CrmActionState } from "./actions";
type Vehicle = {
  id?: string;
  customerId: string;
  plateNumber?: string | null;
  make?: string | null;
  model?: string | null;
  modelYear?: number | null;
  color?: string | null;
  vin?: string | null;
  mileage?: number | null;
  notes?: string | null;
};
export function VehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const editing = Boolean(vehicle.id);
  const [state, action, pending] = useActionState(
    editing ? updateVehicle : createVehicle,
    {} as CrmActionState,
  );
  return (
    <form action={action} className="space-y-4">
      <input name="customerId" type="hidden" value={vehicle.customerId} />
      {vehicle.id ? <input name="vehicleId" type="hidden" value={vehicle.id} /> : null}
      <FormSection
        title={editing ? "Vehicle details" : "Add vehicle"}
        description="Mileage is recorded with today’s date until a service visit is linked."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Plate number
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={vehicle.plateNumber ?? ""}
              name="plateNumber"
            />
          </label>
          <label className="text-sm font-medium">
            VIN
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={vehicle.vin ?? ""}
              maxLength={17}
              name="vin"
            />
          </label>
          <label className="text-sm font-medium">
            Make
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={vehicle.make ?? ""}
              name="make"
            />
          </label>
          <label className="text-sm font-medium">
            Model
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={vehicle.model ?? ""}
              name="model"
            />
          </label>
          <label className="text-sm font-medium">
            Year
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={vehicle.modelYear ?? ""}
              name="modelYear"
              type="number"
            />
          </label>
          <label className="text-sm font-medium">
            Color
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={vehicle.color ?? ""}
              name="color"
            />
          </label>
          <label className="text-sm font-medium">
            Current mileage
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={vehicle.mileage ?? ""}
              min="0"
              name="mileage"
              type="number"
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Vehicle notes
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border bg-background p-3"
              defaultValue={vehicle.notes ?? ""}
              name="notes"
            />
          </label>
        </div>
      </FormSection>
      <ServerError message={state.error} />
      {state.message ? (
        <p className="text-sm text-success" role="status">
          {state.message}
        </p>
      ) : null}
      <Button disabled={pending}>{pending ? "Saving…" : editing ? "Save vehicle" : "Add vehicle"}</Button>
    </form>
  );
}
