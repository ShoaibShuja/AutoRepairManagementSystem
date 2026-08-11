import { Wrench } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { getCurrentStaff } from "@/lib/auth/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { appConfig } from "@/config/app";

export default async function LoginPage() {
  if (await getCurrentStaff()) redirect("/dashboard");
  return (
    <main className="relative grid min-h-dvh place-items-center bg-brand-surface px-5 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-brand-primary text-brand-primary-foreground">
            <Wrench className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold">{appConfig.name}</p>
            <p className="text-sm text-muted-foreground">Staff workspace</p>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mb-6 mt-2 text-sm leading-6 text-muted-foreground">
          Use the work account created by your administrator.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
