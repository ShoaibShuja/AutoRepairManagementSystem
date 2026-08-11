/* eslint-disable @typescript-eslint/no-explicit-any -- relation types are regenerated after reset. */
import { notFound } from "next/navigation";
import { CurrencyDisplay, PageHeader, StatusBadge } from "@/components/operational";
import { recordPayment, voidInvoice } from "@/features/invoicing/actions";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { appConfig } from "@/config/app";
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "front_desk"]);
  const { id } = await params;
  const { data } = await (
    await createClient()
  )
    .from("invoices")
    .select(
      "id,invoice_number,status,currency_code,total_minor,work_order_id,invoice_items(description,quantity,line_total_minor),payments(method,received_at),work_orders(public_number,customers(full_name,phone),vehicles(plate_number,make,model))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const invoice = data as any;
  return (
    <section className="print:mx-auto print:max-w-3xl">
      <PageHeader
        eyebrow="Invoice"
        title={invoice.invoice_number}
        description={`Work order WO-${String(invoice.work_orders?.public_number).padStart(6, "0")}`}
      />
      <div className="mt-6 space-y-5 rounded-lg border bg-card p-6 print:border-0">
        <div className="flex justify-between">
          <div>
            <h2 className="font-semibold">{appConfig.name}</h2>
            <p className="text-sm">
              {invoice.work_orders?.customers?.full_name} · {invoice.work_orders?.vehicles?.plate_number}
            </p>
          </div>
          <StatusBadge
            status={
              invoice.status === "void" ? "cancelled" : invoice.status === "paid" ? "completed" : "pending"
            }
          />
        </div>
        <table className="w-full text-sm">
          <tbody>
            {invoice.invoice_items.map((item: any) => (
              <tr className="border-b" key={item.description}>
                <td className="py-2">{item.description}</td>
                <td>{item.quantity}</td>
                <td className="text-right">
                  <CurrencyDisplay amount={item.line_total_minor} currency={invoice.currency_code} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-right font-semibold">
          Total: <CurrencyDisplay amount={invoice.total_minor} currency={invoice.currency_code} />
        </p>
        {invoice.payments?.length ? (
          <p className="text-sm">
            Paid by {invoice.payments[0].method.replaceAll("_", " ")} on{" "}
            {new Date(invoice.payments[0].received_at).toLocaleString()}
          </p>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-muted-foreground print:hidden">
        Use your browser Print command to print or save this invoice as a PDF.
      </p>
      {invoice.status === "issued" ? (
        <div className="mt-6 grid gap-4 print:hidden md:grid-cols-2">
          <form action={recordPayment} className="rounded border p-4">
            <input name="invoiceId" type="hidden" value={invoice.id} />
            <h2 className="font-semibold">Record payment</h2>
            <select className="mt-2 h-10 w-full rounded border" name="method">
              <option value="cash">Cash</option>
              <option value="card_in_person">Card in person</option>
            </select>
            <input
              className="mt-2 h-10 w-full rounded border px-2"
              name="reference"
              placeholder="Reference"
            />
            <button className="mt-2 rounded bg-brand-primary px-3 py-2 text-sm text-brand-primary-foreground">
              Mark paid
            </button>
          </form>
          <form action={voidInvoice} className="rounded border p-4">
            <input name="invoiceId" type="hidden" value={invoice.id} />
            <h2 className="font-semibold">Void invoice</h2>
            <input
              className="mt-2 h-10 w-full rounded border px-2"
              name="reason"
              placeholder="Required reason"
              required
            />
            <button className="mt-2 text-sm text-destructive">Void invoice</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
