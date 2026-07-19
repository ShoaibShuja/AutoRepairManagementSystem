import { Wrench } from "lucide-react";

export default function HomePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-16">
      <section className="max-w-xl space-y-5 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-surface text-brand-primary">
          <Wrench aria-hidden="true" className="size-6" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">AutoCare Pro</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Operations foundation is ready.
        </h1>
        <p className="text-pretty text-base leading-7 text-muted-foreground">
          The staff workspace, authentication, and operational modules will be introduced in the next delivery
          phases.
        </p>
      </section>
    </main>
  );
}
