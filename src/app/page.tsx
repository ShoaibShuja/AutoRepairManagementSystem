import { redirect } from "next/navigation";

import { getCurrentStaff } from "@/lib/auth/server";

export default async function HomePage() {
  redirect((await getCurrentStaff()) ? "/dashboard" : "/login");
}
