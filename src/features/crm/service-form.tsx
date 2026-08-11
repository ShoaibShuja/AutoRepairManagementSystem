"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormSection, ServerError } from "@/components/operational";
import { minorUnitsToMoneyInput } from "@/lib/money";
import { createService, updateService, type CrmActionState } from "./actions";
type Service = {
  id?: string;
  name?: string;
  category?: string | null;
  standardPriceMinor?: number;
  defaultDurationMinutes?: number;
  description?: string | null;
};
export function ServiceForm({ service }: { service?: Service }) {
  const editing = Boolean(service?.id);
  const [state, action, pending] = useActionState(
    editing ? updateService : createService,
    {} as CrmActionState,
  );
  return (
    <form action={action} className="space-y-4">
      {service?.id ? <input name="serviceId" type="hidden" value={service.id} /> : null}
      <FormSection
        title={editing ? "Edit service" : "Add service"}
        description="Catalog changes apply to future work. Existing work orders retain their saved service snapshots."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Service name *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={service?.name ?? ""}
              name="name"
              required
            />
          </label>
          <label className="text-sm font-medium">
            Category *
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={service?.category ?? "wash"}
              name="category"
            >
              <option value="wash">Wash</option>
              <option value="maintenance">Maintenance</option>
              <option value="repair">Repair</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Standard price (AFN) *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={
                service?.standardPriceMinor === undefined
                  ? ""
                  : minorUnitsToMoneyInput(service.standardPriceMinor)
              }
              inputMode="decimal"
              name="standardPrice"
              placeholder="For example, 1500 or 1500.50"
              required
              type="text"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Whole amounts do not need decimals.
            </span>
          </label>
          <label className="text-sm font-medium">
            Estimated duration (minutes) *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={service?.defaultDurationMinutes ?? 60}
              min="1"
              name="defaultDurationMinutes"
              required
              type="number"
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Description or internal notes
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border bg-background p-3"
              defaultValue={service?.description ?? ""}
              name="description"
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
      <Button disabled={pending}>{pending ? "Saving…" : editing ? "Save service" : "Add service"}</Button>
    </form>
  );
}
