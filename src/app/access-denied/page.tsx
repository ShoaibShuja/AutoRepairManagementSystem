import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <section className="max-w-md space-y-4 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Access restricted
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">This area is not available to your account.</h1>
        <p className="text-muted-foreground">Ask an administrator if you need access to this workspace.</p>
        <Link
          className="inline-flex h-9 items-center rounded-md bg-brand-primary px-4 text-sm font-medium text-brand-primary-foreground"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
