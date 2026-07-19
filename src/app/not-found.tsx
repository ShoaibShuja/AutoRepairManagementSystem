import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <section className="max-w-md space-y-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">
          The page you requested does not exist or is no longer available.
        </p>
        <Link
          className="inline-flex text-sm font-medium text-brand-primary underline underline-offset-4"
          href="/"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
