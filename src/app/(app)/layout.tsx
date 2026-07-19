import { AppShell } from "@/components/app-shell/app-shell";
import { requireStaff } from "@/lib/auth/server";

export default async function StaffLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const staff = await requireStaff();
  return <AppShell staff={staff}>{children}</AppShell>;
}
