import Link from "next/link";

import { signOut } from "@/features/auth/actions";
import { requireStaff } from "@/lib/auth/server";

export default async function StaffLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const staff = await requireStaff();
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link className="font-semibold tracking-tight" href="/dashboard">
            AutoCare Pro
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {staff.display_name} · {staff.role.replace("_", " ")}
            </span>
            <form action={signOut}>
              <button
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
