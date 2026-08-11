"use client";

import { Menu, Wrench, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getBreadcrumb, getNavigationForRole } from "@/components/app-shell/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import type { StaffRole } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  staff,
}: Readonly<{ children: React.ReactNode; staff: { display_name: string; email: string; role: StaffRole } }>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navigation = getNavigationForRole(staff.role);
  const breadcrumb = getBreadcrumb(pathname);
  const nav = (
    <>
      <div className="flex h-[4.5rem] items-center gap-3 border-b border-border/80 px-5">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-primary text-brand-primary-foreground shadow-[0_8px_20px_color-mix(in_oklab,var(--brand-primary),transparent_72%)]">
          <Wrench aria-hidden="true" className="size-4" />
        </span>
        <span className="font-semibold tracking-[-0.03em]">AutoCare Pro</span>
      </div>
      <nav aria-label="Primary navigation" className="flex-1 space-y-1 p-3">
        {navigation.map(({ href, icon: Icon, label }) => {
          const current = pathname === href;
          return (
            <Link
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                current
                  ? "bg-brand-primary text-brand-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-brand-surface hover:text-brand-surface-foreground",
              )}
              href={href}
              key={href}
              onClick={() => setMenuOpen(false)}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-brand-primary/10 bg-brand-surface/70 p-3 text-xs leading-5 text-brand-surface-foreground">
        Single-location operations workspace
      </div>
    </>
  );
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[16.25rem_minmax(0,1fr)]">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:p-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <aside className="hidden min-h-dvh border-r border-border/80 bg-card lg:flex lg:flex-col">{nav}</aside>
      {menuOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            aria-label="Dismiss navigation menu"
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col bg-card shadow-xl">
            <Button
              aria-label="Close navigation menu"
              className="absolute right-3 top-3"
              onClick={() => setMenuOpen(false)}
              size="icon"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
            {nav}
          </aside>
        </div>
      ) : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 backdrop-blur-md">
          <div className="flex h-[4.5rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              aria-label="Open navigation menu"
              className="lg:hidden"
              onClick={() => setMenuOpen(true)}
              size="icon"
              variant="ghost"
            >
              <Menu aria-hidden="true" className="size-5" />
            </Button>
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-xs text-muted-foreground"
            >
              {breadcrumb.map((segment, index) => (
                <span className="flex shrink-0 items-center gap-2" key={segment}>
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  <span
                    className={index === breadcrumb.length - 1 ? "font-medium text-foreground" : undefined}
                  >
                    {segment}
                  </span>
                </span>
              ))}
            </nav>
            <ThemeToggle />
            <details className="relative shrink-0">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-2 text-left text-sm hover:bg-muted [&::-webkit-details-marker]:hidden">
                <span
                  className="grid size-8 place-items-center rounded-full bg-brand-surface text-xs font-semibold text-brand-surface-foreground"
                  aria-hidden="true"
                >
                  {staff.display_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden max-w-36 truncate sm:block">{staff.display_name}</span>
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-64 rounded-xl border bg-card p-2 shadow-lg">
                <div className="border-b px-2 py-2 text-sm">
                  <p className="truncate font-medium">{staff.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {staff.role.replace("_", " ")}
                  </p>
                </div>
                <form action={signOut} className="pt-2">
                  <button
                    className="flex min-h-10 w-full items-center rounded-md px-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
