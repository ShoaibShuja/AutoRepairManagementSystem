"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormSection, ServerError } from "@/components/operational";
import { createCustomer, updateCustomer, type CrmActionState } from "./actions";
type Customer = {
  id?: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};
export function CustomerForm({ customer }: { customer?: Customer }) {
  const editing = Boolean(customer?.id);
  const [state, action, pending] = useActionState(
    editing ? updateCustomer : createCustomer,
    {} as CrmActionState,
  );
  return (
    <form action={action} className="space-y-4">
      {customer?.id ? <input name="customerId" type="hidden" value={customer.id} /> : null}
      <FormSection
        title={editing ? "Customer details" : "New customer"}
        description="Phone numbers can be shared by family members; similar records are a warning for staff, not a blocking rule."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Full name *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={customer?.fullName ?? ""}
              name="fullName"
              required
            />
          </label>
          <label className="text-sm font-medium">
            Phone
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={customer?.phone ?? ""}
              name="phone"
              type="tel"
            />
          </label>
          <label className="text-sm font-medium">
            Email
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={customer?.email ?? ""}
              name="email"
              type="email"
            />
          </label>
          <label className="text-sm font-medium">
            Address
            <input
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              defaultValue={customer?.address ?? ""}
              name="address"
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Operational notes
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border bg-background p-3"
              defaultValue={customer?.notes ?? ""}
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
      <Button disabled={pending}>
        {pending ? "Saving…" : editing ? "Save customer" : "Create customer"}
      </Button>
    </form>
  );
}
