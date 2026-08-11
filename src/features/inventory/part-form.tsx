"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormSection, ServerError } from "@/components/operational";
import { minorUnitsToMoneyInput } from "@/lib/money";
import { savePart, type InventoryActionState } from "./actions";
type Part = {
  id?: string;
  name?: string;
  sku?: string | null;
  category?: string | null;
  unit?: string;
  quantity?: number;
  threshold?: number;
  cost?: number | null;
  selling?: number;
};
export function PartForm({ part, admin }: { part?: Part; admin: boolean }) {
  const [state, action, pending] = useActionState(savePart, {} as InventoryActionState);
  return (
    <form action={action} className="space-y-4">
      {part?.id ? <input name="partId" type="hidden" value={part.id} /> : null}
      <FormSection
        title={part ? "Edit part" : "New part"}
        description="Opening stock is recorded only when the part is created; later changes must use an immutable movement."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Name *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={part?.name ?? ""}
              name="name"
              required
            />
          </label>
          <label className="text-sm font-medium">
            SKU
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={part?.sku ?? ""}
              name="sku"
            />
          </label>
          <label className="text-sm font-medium">
            Category
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={part?.category ?? ""}
              name="category"
            />
          </label>
          <label className="text-sm font-medium">
            Unit *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={part?.unit ?? "each"}
              name="unit"
              required
            />
          </label>
          <label className="text-sm font-medium">
            {part ? "Current stock (read-only after creation)" : "Opening stock"}
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={part?.quantity ?? 0}
              disabled={Boolean(part)}
              name="quantity"
              min="0"
              type="number"
            />
          </label>
          <label className="text-sm font-medium">
            Minimum stock *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={part?.threshold ?? 0}
              name="threshold"
              min="0"
              required
              type="number"
            />
          </label>
          {admin ? (
            <label className="text-sm font-medium">
              Cost (AFN, optional)
              <input
                className="mt-1 h-10 w-full rounded-md border bg-background px-3"
                defaultValue={
                  part?.cost === undefined || part.cost === null ? "" : minorUnitsToMoneyInput(part.cost)
                }
                inputMode="decimal"
                name="cost"
                placeholder="For example, 1000"
                type="text"
              />
            </label>
          ) : null}
          <label className="text-sm font-medium">
            Selling price (AFN) *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={part?.selling === undefined ? "" : minorUnitsToMoneyInput(part.selling)}
              inputMode="decimal"
              name="selling"
              placeholder="For example, 1500 or 1500.50"
              required
              type="text"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Whole amounts do not need decimals.
            </span>
          </label>
        </div>
      </FormSection>
      <ServerError message={state.error} />
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
      <Button disabled={pending}>{pending ? "Saving…" : "Save part"}</Button>
    </form>
  );
}
