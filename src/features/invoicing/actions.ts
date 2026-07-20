"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
const value=(data:FormData,name:string)=>String(data.get(name)??"");
const invoiceIdSchema = z.string().uuid();
const paymentSchema = z.object({ invoiceId: z.string().uuid(), method: z.enum(["cash", "card_in_person"]), reference: z.string().trim().max(120), notes: z.string().trim().max(2000) });
export async function createInvoice(formData:FormData){await requireRole(["admin","front_desk"]);const {data,error}=await(await createClient()).rpc("create_invoice_from_work_order",{target_work_order_id:value(formData,"workOrderId")});if(!error&&data)redirect(`/invoices/${data}`);}
export async function recordPayment(formData:FormData){await requireRole(["admin","front_desk"]);const parsed=paymentSchema.safeParse({invoiceId:value(formData,"invoiceId"),method:value(formData,"method"),reference:value(formData,"reference"),notes:value(formData,"notes")});if(!parsed.success)return;const {error}=await(await createClient()).rpc("record_offline_payment",{target_invoice_id:parsed.data.invoiceId,payment_method:parsed.data.method,payment_reference:parsed.data.reference||null,payment_notes:parsed.data.notes||null});if(!error)revalidatePath(`/invoices/${parsed.data.invoiceId}`);}
export async function voidInvoice(formData:FormData){await requireRole(["admin","front_desk"]);const id=invoiceIdSchema.safeParse(value(formData,"invoiceId"));const reason=z.string().trim().min(1).max(1000).safeParse(value(formData,"reason"));if(!id.success||!reason.success)return;const {error}=await(await createClient()).rpc("void_invoice",{target_invoice_id:id.data,reason:reason.data});if(!error)revalidatePath(`/invoices/${id.data}`);}
