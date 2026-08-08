"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "./customer-form";

export function CustomerCreateDialog() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button className="h-11 rounded-xl px-5 shadow-sm" onClick={() => setOpen(true)} type="button">
        <Plus aria-hidden="true" className="size-4" />
        Add customer
      </Button>
      <dialog
        aria-labelledby="new-customer-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-foreground/35"
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/80 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-surface-foreground">
              Customer directory
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]" id="new-customer-title">
              Add a customer
            </h2>
          </div>
          <Button
            aria-label="Close add customer dialog"
            onClick={() => setOpen(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="p-5 sm:p-6">
          <CustomerForm />
        </div>
      </dialog>
    </>
  );
}
