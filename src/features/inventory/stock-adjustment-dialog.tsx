"use client";

import { Minus, PackagePlus, Plus, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { ServerError } from "@/components/operational";
import { Button } from "@/components/ui/button";
import { adjustInventory, type InventoryActionState } from "./actions";

type AdjustmentMode = "restock" | "correction";

export function StockAdjustmentDialog({
  partId,
  partName,
  quantity,
  unit,
  admin,
}: {
  partId: string;
  partName: string;
  quantity: number;
  unit: string;
  admin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AdjustmentMode>("restock");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(adjustInventory, {} as InventoryActionState);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button className="h-11 rounded-xl px-4" type="button" variant="outline" onClick={() => setOpen(true)}>
        <PackagePlus aria-hidden="true" className="size-4" />
        Adjust stock
      </Button>
      <dialog
        aria-labelledby={`stock-adjustment-${partId}`}
        className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-foreground/35"
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/80 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-surface-foreground">
              Stock update
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]" id={`stock-adjustment-${partId}`}>
              {partName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              On hand:{" "}
              <span className="font-semibold text-foreground">
                {quantity} {unit}
              </span>
            </p>
          </div>
          <Button
            aria-label="Close stock adjustment"
            onClick={() => setOpen(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <form action={action} className="space-y-5 p-5">
          <input name="partId" type="hidden" value={partId} />
          <input name="mode" type="hidden" value={mode} />
          {admin ? (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              <button
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${mode === "restock" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setMode("restock")}
                type="button"
              >
                <Plus aria-hidden="true" className="size-4" />
                Add stock
              </button>
              <button
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${mode === "correction" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setMode("correction")}
                type="button"
              >
                <Minus aria-hidden="true" className="size-4" />
                Correct count
              </button>
            </div>
          ) : null}
          <label className="block text-sm font-medium">
            {mode === "restock" ? `Amount to add (${unit})` : `Increase or decrease (${unit})`}
            <input
              autoFocus
              className="mt-1 h-11 w-full rounded-xl border bg-background px-3"
              min={mode === "restock" ? "0.001" : undefined}
              name="quantity"
              placeholder={mode === "restock" ? "For example, 12" : "For example, -2 or 2"}
              required
              step="0.001"
              type="number"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {mode === "restock"
                ? "Use a positive amount to add received stock."
                : "Use a negative number to remove stock or a positive number to add it."}
            </span>
          </label>
          <label className="block text-sm font-medium">
            {mode === "restock" ? "Note (optional)" : "Reason for correction *"}
            <input
              className="mt-1 h-11 w-full rounded-xl border bg-background px-3"
              name="reason"
              placeholder={
                mode === "restock" ? "For example, delivery received" : "For example, physical count"
              }
              required={mode === "correction"}
            />
          </label>
          <ServerError message={state.error} />
          {state.message ? (
            <p className="text-sm text-success" role="status">
              {state.message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-border/80 pt-4">
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? "Saving…" : mode === "restock" ? "Add stock" : "Record correction"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
