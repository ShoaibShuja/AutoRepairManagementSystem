/* eslint-disable @typescript-eslint/no-explicit-any -- generated operational relation types follow local reset. */
import type { ComponentType } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  PackageSearch,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/server";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Icon = ComponentType<{ className?: string }>;

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: Icon;
  tone: "blue" | "violet" | "amber" | "rose" | "emerald";
};

const metricToneClasses = {
  blue: "bg-brand-surface text-brand-surface-foreground",
  violet: "bg-brand-primary/10 text-brand-primary",
  amber: "bg-warning/15 text-warning",
  rose: "bg-destructive/10 text-destructive",
  emerald: "bg-success/15 text-success",
} as const;

function MetricCard({ label, value, detail, icon: Icon, tone }: MetricCardProps) {
  return (
    <section className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-[0_10px_30px_-20px_color-mix(in_oklab,var(--foreground),transparent_65%)] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.045em] tabular-nums">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-xl ${metricToneClasses[tone]}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-4 border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">{detail}</p>
    </section>
  );
}

function QuickLink({
  href,
  label,
  detail,
  icon: Icon,
}: {
  href: string;
  label: string;
  detail: string;
  icon: Icon;
}) {
  return (
    <Link
      className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-muted focus-visible:border-ring"
      href={href}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-surface text-brand-surface-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export default async function DashboardPage() {
  const staff = await requireStaff();
  const db = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const [appointments, active, queued, completed, low, unpaid, revenue] = await Promise.all([
    db
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", today.toISOString())
      .lt("starts_at", tomorrow.toISOString()),
    db.from("work_orders").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    db
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "assigned", "ready_for_review"]),
    db
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", today.toISOString())
      .lt("completed_at", tomorrow.toISOString()),
    db
      .from("parts")
      .select("id", { count: "exact", head: true })
      .filter("quantity_on_hand", "lte", "reorder_threshold")
      .is("archived_at", null),
    db.from("invoices").select("id", { count: "exact", head: true }).eq("status", "issued"),
    staff.role === "technician"
      ? Promise.resolve({ data: null })
      : db
          .from("payments")
          .select("amount_minor")
          .gte("received_at", today.toISOString())
          .lt("received_at", tomorrow.toISOString()),
  ]);
  const dailyRevenue = (revenue.data ?? []).reduce(
    (sum: number, row: any) => sum + Number(row.amount_minor),
    0,
  );
  const hasAlerts =
    (low.count ?? 0) > 0 ||
    (queued.count ?? 0) > 0 ||
    (staff.role !== "technician" && (unpaid.count ?? 0) > 0);
  const quickLinks =
    staff.role === "technician"
      ? [{ href: "/my-work", label: "Open my work", detail: "Review jobs assigned to you", icon: Wrench }]
      : [
          {
            href: "/appointments",
            label: "Appointments",
            detail: "Review today’s schedule",
            icon: CalendarDays,
          },
          {
            href: "/work-orders",
            label: "Work orders",
            detail: "Manage the active job queue",
            icon: ClipboardCheck,
          },
          {
            href: "/inventory",
            label: "Inventory",
            detail: "Check parts and stock levels",
            icon: PackageSearch,
          },
        ];

  return (
    <section className="space-y-6">
      <header className="relative isolate overflow-hidden rounded-3xl bg-brand-primary px-6 py-7 text-brand-primary-foreground shadow-[0_24px_55px_-35px_color-mix(in_oklab,var(--brand-primary),black_20%)] sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-32 size-72 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/3 size-44 translate-y-1/2 rounded-full border border-white/15"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-primary-foreground/70">
              {format(today, "EEEE, MMMM d")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Command center</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-brand-primary-foreground/75 sm:text-base">
              A live view of today’s service floor, workshop queue, and follow-up priorities.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <span className={`relative flex size-3 ${hasAlerts ? "text-warning" : "text-success"}`}>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-3 rounded-full bg-current" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-primary-foreground/60">
                Live status
              </p>
              <p className="mt-0.5 text-sm font-semibold">{hasAlerts ? "Follow-up needed" : "All clear"}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today's appointments"
          value={String(appointments.count ?? 0)}
          detail="Visits scheduled for today"
          icon={CalendarDays}
          tone="blue"
        />
        <MetricCard
          label="Jobs in progress"
          value={String(active.count ?? 0)}
          detail="Vehicles currently on the floor"
          icon={Wrench}
          tone="violet"
        />
        <MetricCard
          label="Waiting or queued"
          value={String(queued.count ?? 0)}
          detail="Jobs awaiting the next action"
          icon={Clock3}
          tone="amber"
        />
        <MetricCard
          label="Low-stock parts"
          value={String(low.count ?? 0)}
          detail="Parts at or below reorder level"
          icon={PackageSearch}
          tone="rose"
        />
      </div>

      <div className={`grid gap-4 ${staff.role === "technician" ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        <MetricCard
          label="Completed today"
          value={String(completed.count ?? 0)}
          detail="Jobs completed during this business day"
          icon={CheckCircle2}
          tone="emerald"
        />
        {staff.role !== "technician" ? (
          <>
            <MetricCard
              label="Collected today"
              value={formatMoney(dailyRevenue)}
              detail="Recorded offline payments today"
              icon={CircleDollarSign}
              tone="blue"
            />
            <MetricCard
              label="Unpaid invoices"
              value={String(unpaid.count ?? 0)}
              detail="Issued invoices without a recorded payment"
              icon={ClipboardCheck}
              tone="amber"
            />
          </>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_12px_32px_-24px_color-mix(in_oklab,var(--foreground),transparent_55%)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-surface-foreground">
                Operational pulse
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">What needs attention</h2>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Live counts
            </span>
          </div>
          <div
            className={`mt-6 grid gap-3 ${staff.role === "technician" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
          >
            <div className="rounded-xl bg-brand-surface/70 p-4">
              <p className="text-2xl font-semibold tracking-[-0.04em] tabular-nums text-brand-surface-foreground">
                {queued.count ?? 0}
              </p>
              <p className="mt-1 text-sm font-medium">Queue to review</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Move waiting jobs to their next permitted status.
              </p>
            </div>
            <div className="rounded-xl bg-destructive/10 p-4">
              <p className="text-2xl font-semibold tracking-[-0.04em] tabular-nums text-destructive">
                {low.count ?? 0}
              </p>
              <p className="mt-1 text-sm font-medium">Stock to review</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Restock parts that have reached their reorder level.
              </p>
            </div>
            {staff.role !== "technician" ? (
              <div className="rounded-xl bg-warning/15 p-4">
                <p className="text-2xl font-semibold tracking-[-0.04em] tabular-nums text-warning">
                  {unpaid.count ?? 0}
                </p>
                <p className="mt-1 text-sm font-medium">Payments to record</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Issued invoices still awaiting an offline payment.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_12px_32px_-24px_color-mix(in_oklab,var(--foreground),transparent_55%)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-surface-foreground">
            Workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Keep the day moving</h2>
          <div className="mt-4 divide-y divide-border/80">
            {quickLinks.map((link) => (
              <QuickLink key={link.href} {...link} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
