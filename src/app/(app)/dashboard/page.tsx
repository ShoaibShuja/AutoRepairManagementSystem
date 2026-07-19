import Link from "next/link";

import { requireStaff } from "@/lib/auth/server";

export default async function DashboardPage() {
  const staff = await requireStaff();
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Signed in as {staff.role.replace("_", " ")}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Operations workspace</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Authentication and role protection are active. Operational modules will be added in the next
          delivery phases.
        </p>
      </div>
      {staff.role === "admin" ? (
        <Link
          className="inline-flex h-9 items-center rounded-md bg-brand-primary px-4 text-sm font-medium text-brand-primary-foreground"
          href="/staff"
        >
          Manage staff
        </Link>
      ) : null}
    </section>
  );
}
