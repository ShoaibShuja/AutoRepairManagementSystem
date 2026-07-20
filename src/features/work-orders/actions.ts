"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, requireStaff } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { workOrderSchema } from "./validation";

export type WorkOrderActionState = { error?: string; message?: string };
const value = (data: FormData, name: string) => String(data.get(name) ?? "");
const serviceIds = (data: FormData) => data.getAll("serviceIds").map(String);
const input = (data: FormData) => ({
  customerId: value(data, "customerId"),
  vehicleId: value(data, "vehicleId"),
  technicianId: value(data, "technicianId"),
  concern: value(data, "concern"),
  internalNotes: value(data, "internalNotes"),
  estimatedCompletionAt: value(data, "estimatedCompletionAt"),
  mileage: value(data, "mileage"),
  serviceIds: serviceIds(data),
});
const detailsArgs = (parsed: ReturnType<typeof workOrderSchema.parse>) => ({
  target_technician_id: parsed.technicianId,
  concern: parsed.concern,
  internal_note: parsed.internalNotes,
  estimated_completion: parsed.estimatedCompletionAt,
  intake_mileage: parsed.mileage ?? null,
  selected_services: parsed.serviceIds.map((serviceId) => ({ serviceId })),
});

export async function createWorkOrder(
  _: WorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  await requireRole(["admin", "front_desk"]);
  const parsed = workOrderSchema.safeParse(input(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { data, error } = await (
    await createClient()
  ).rpc("create_work_order", {
    target_customer_id: parsed.data.customerId,
    target_vehicle_id: parsed.data.vehicleId,
    ...detailsArgs(parsed.data),
  });
  if (error || !data)
    return {
      error: "Work order could not be created. Confirm the customer, vehicle, and services are active.",
    };
  redirect(`/work-orders/${data}`);
}

export async function updateWorkOrder(
  _: WorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  await requireRole(["admin", "front_desk"]);
  const parsed = workOrderSchema.safeParse(input(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const workOrderId = value(formData, "workOrderId");
  const { error } = await (
    await createClient()
  ).rpc("update_work_order_details", { target_work_order_id: workOrderId, ...detailsArgs(parsed.data) });
  if (error)
    return { error: "Work order could not be updated. Only draft or assigned orders can be edited." };
  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath("/work-orders");
  return { message: "Work order updated." };
}

export async function transitionWorkOrder(formData: FormData) {
  const staff = await requireStaff();
  const parsed = z
    .object({
      workOrderId: z.string().uuid(),
      nextStatus: z.enum([
        "assigned",
        "in_progress",
        "ready_for_review",
        "completed",
        "invoiced",
        "cancelled",
      ]),
      note: z.string().trim().max(2000),
    })
    .safeParse({
      workOrderId: value(formData, "workOrderId"),
      nextStatus: value(formData, "nextStatus"),
      note: value(formData, "note"),
    });
  if (!parsed.success) return;
  const { workOrderId, nextStatus, note } = parsed.data;
  const { error } = await (
    await createClient()
  ).rpc("transition_work_order", {
    target_work_order_id: workOrderId,
    next_status: nextStatus,
    note: note || null,
  });
  if (error) return;
  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath("/work-orders");
  revalidatePath("/my-work");
  if (staff.role !== "technician") revalidatePath(`/vehicles/${value(formData, "vehicleId")}`);
}

export async function addTechnicianNote(
  _: WorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  await requireRole(["technician"]);
  const workOrderId = value(formData, "workOrderId");
  const { error } = await (
    await createClient()
  ).rpc("add_technician_note", { target_work_order_id: workOrderId, note: value(formData, "note") });
  if (error) return { error: "The note could not be added to this assigned work order." };
  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath("/my-work");
  return { message: "Technical note added." };
}
export async function addTechnicianNoteForm(formData: FormData) {
  await addTechnicianNote({}, formData);
}
