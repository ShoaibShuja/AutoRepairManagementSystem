"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updateStaff, type AuthActionState } from "@/features/auth/actions";
import type { StaffRole } from "@/lib/auth/permissions";

const initialState: AuthActionState = {};

export function StaffRowActions({
  id,
  role,
  status,
  isCurrentUser,
}: Readonly<{ id: string; role: StaffRole; status: "active" | "inactive"; isCurrentUser: boolean }>) {
  const [state, action, pending] = useActionState(updateStaff, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="staffId" type="hidden" value={id} />
      <select
        aria-label="Staff role"
        className="h-8 rounded-md border bg-background px-2 text-xs"
        defaultValue={role}
        name="role"
      >
        <option value="admin">Admin</option>
        <option value="front_desk">Front desk</option>
        <option value="technician">Technician</option>
      </select>
      <Button disabled={pending} size="sm" type="submit" variant="outline">
        Save role
      </Button>
      <button
        className="text-xs font-medium text-destructive disabled:opacity-50"
        disabled={pending || isCurrentUser}
        name="accountStatus"
        type="submit"
        value={status === "active" ? "inactive" : "active"}
      >
        {status === "active" ? "Deactivate" : "Activate"}
      </button>
      {state.error ? (
        <span className="w-full text-xs text-destructive" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
