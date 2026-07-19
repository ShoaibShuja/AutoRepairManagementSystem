"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { createStaff, type AuthActionState } from "@/features/auth/actions";

const initialState: AuthActionState = {};

export function StaffForm() {
  const [state, action, pending] = useActionState(createStaff, initialState);
  return (
    <form action={action} className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
      <div>
        <label className="text-sm font-medium" htmlFor="displayName">
          Name
        </label>
        <input
          className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm"
          id="displayName"
          name="displayName"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="staffEmail">
          Work email
        </label>
        <input
          className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm"
          id="staffEmail"
          name="email"
          type="email"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="staffPassword">
          Initial password
        </label>
        <input
          className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm"
          id="staffPassword"
          name="password"
          type="password"
          minLength={12}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="role">
          Role
        </label>
        <select
          className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm"
          id="role"
          name="role"
          defaultValue="technician"
        >
          <option value="technician">Technician</option>
          <option value="front_desk">Front desk</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        {state.error ? (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="mb-3 text-sm text-success" role="status">
            {state.message}
          </p>
        ) : null}
        <Button disabled={pending} type="submit">
          {pending ? "Creating…" : "Create staff account"}
        </Button>
      </div>
    </form>
  );
}
