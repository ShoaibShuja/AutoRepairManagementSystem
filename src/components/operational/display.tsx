import type { ReactNode } from "react";
import { AlertTriangle, CircleAlert, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow = "Operations",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
export function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </section>
  );
}
const statusStyles = {
  active: "bg-success/15 text-success",
  scheduled: "bg-brand-surface text-brand-surface-foreground",
  pending: "bg-warning/15 text-warning",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  inactive: "bg-muted text-muted-foreground",
} as const;
export function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="grid min-h-56 place-items-center rounded-lg border border-dashed bg-card p-6 text-center">
      <div className="max-w-sm">
        <SearchX aria-hidden="true" className="mx-auto size-7 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </section>
  );
}
export function ErrorState({
  title = "We could not load this section",
  description = "Try again. If the problem continues, contact an administrator.",
  retry,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
}) {
  return (
    <section className="rounded-lg border border-destructive/30 bg-card p-5">
      <div className="flex gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 text-destructive" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          {retry ? (
            <Button className="mt-4" onClick={retry} size="sm" variant="outline">
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
export function PermissionDenied({ title = "Access restricted" }: { title?: string }) {
  return (
    <section className="grid min-h-56 place-items-center rounded-lg border bg-card p-6 text-center">
      <div className="max-w-sm">
        <AlertTriangle aria-hidden="true" className="mx-auto size-7 text-warning" />
        <h1 className="mt-3 text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Ask an administrator if you need access to this workspace.
        </p>
      </div>
    </section>
  );
}
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-label="Loading"
      className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)}
    />
  );
}
export function DateDisplay({ value, pattern }: { value: Date | string; pattern?: string }) {
  return <time dateTime={new Date(value).toISOString()}>{formatDateTime(value, pattern)}</time>;
}
export function CurrencyDisplay({ amount, currency }: { amount: number; currency?: string }) {
  return <span>{formatMoney(amount, currency)}</span>;
}
