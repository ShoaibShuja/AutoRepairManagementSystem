"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
const value=(data:FormData,name:string)=>String(data.get(name)??"");
export async function createInvoice(formData:FormData){await requireRole(["admin","front_desk"]);const {data,error}=await(await createClient()).rpc("create_invoice_from_work_order",{target_work_order_id:value(formData,"workOrderId")});if(!error&&data)redirect(`/invoices/${data}`);}
export async function recordPayment(formData:FormData){await requireRole(["admin","front_desk"]);const id=value(formData,"invoiceId");await(await createClient()).rpc("record_offline_payment",{target_invoice_id:id,payment_method:value(formData,"method") as "cash"|"card_in_person",payment_reference:value(formData,"reference")||null,payment_notes:value(formData,"notes")||null});revalidatePath(`/invoices/${id}`);}
export async function voidInvoice(formData:FormData){await requireRole(["admin","front_desk"]);const id=value(formData,"invoiceId");await(await createClient()).rpc("void_invoice",{target_invoice_id:id,reason:value(formData,"reason")});revalidatePath(`/invoices/${id}`);}
