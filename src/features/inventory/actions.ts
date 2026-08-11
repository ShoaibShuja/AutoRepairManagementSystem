"use server";
import { revalidatePath } from "next/cache";
import { requireRole, requireStaff } from "@/lib/auth/server";
import { moneyInputToMinorUnits } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { partSchema, stockAdjustmentSchema } from "./validation";
export type InventoryActionState = { error?: string; message?: string };
const value = (data: FormData, name: string) => String(data.get(name) ?? "");
export async function savePart(_: InventoryActionState, formData: FormData): Promise<InventoryActionState> {
  const staff = await requireRole(["admin", "front_desk"]);
  const id = value(formData, "partId");
  const costInput = value(formData, "cost");
  const cost = costInput.trim() ? moneyInputToMinorUnits(costInput) : null;
  const selling = moneyInputToMinorUnits(value(formData, "selling"));
  if ((costInput.trim() && cost === null) || selling === null)
    return { error: "Enter a valid non-negative price with up to 2 decimal places." };
  const parsed = partSchema.safeParse({
    name: value(formData, "name"),
    sku: value(formData, "sku"),
    category: value(formData, "category"),
    unit: value(formData, "unit"),
    quantity: id ? "0" : value(formData, "quantity"),
    threshold: value(formData, "threshold"),
    cost,
    selling,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (parsed.data.cost !== null && staff.role !== "admin")
    return { error: "Only administrators can set cost information." };
  const db = await createClient();
  const { error } = id
    ? await db.rpc("save_part", {
        target_part_id: id,
        part_name: parsed.data.name,
        part_sku: parsed.data.sku ?? "",
        part_category: parsed.data.category,
        part_unit: parsed.data.unit,
        threshold: parsed.data.threshold,
        cost_minor: staff.role === "admin" ? (parsed.data.cost ?? null) : null,
        selling_minor: parsed.data.selling,
      })
    : await db.rpc("create_part", {
        part_name: parsed.data.name,
        part_sku: parsed.data.sku ?? "",
        part_category: parsed.data.category,
        part_unit: parsed.data.unit,
        opening_quantity: parsed.data.quantity,
        threshold: parsed.data.threshold,
        cost_minor: staff.role === "admin" ? (parsed.data.cost ?? null) : null,
        selling_minor: parsed.data.selling,
      });
  if (error) return { error: "Part could not be saved. SKU values must be unique." };
  revalidatePath("/inventory");
  return { message: id ? "Part updated." : "Part created with an initial stock movement." };
}
export async function adjustInventory(
  _: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const staff = await requireRole(["admin", "front_desk"]);
  const parsed = stockAdjustmentSchema.safeParse({
    partId: value(formData, "partId"),
    mode: value(formData, "mode"),
    quantity: value(formData, "quantity"),
    reason: value(formData, "reason"),
  });
  if (!parsed.success) return { error: "Enter a valid quantity and a shorter reason." };
  if (parsed.data.mode === "restock" && parsed.data.quantity <= 0)
    return { error: "Enter an amount greater than zero to add stock." };
  if (parsed.data.mode === "correction") {
    if (staff.role !== "admin") return { error: "Only administrators can correct inventory counts." };
    if (parsed.data.quantity === 0 || !parsed.data.reason)
      return { error: "Enter a non-zero correction and explain why the count changed." };
  }
  const { error } =
    parsed.data.mode === "restock"
      ? await (
          await createClient()
        ).rpc("restock_part", {
          target_part_id: parsed.data.partId,
          quantity: parsed.data.quantity,
          reason: parsed.data.reason || null,
        })
      : await (
          await createClient()
        ).rpc("correct_inventory", {
          target_part_id: parsed.data.partId,
          quantity_delta: parsed.data.quantity,
          reason: parsed.data.reason,
        });
  if (error)
    return {
      error:
        parsed.data.mode === "restock"
          ? "Stock could not be added."
          : "The inventory correction could not be recorded.",
    };
  revalidatePath("/inventory");
  return { message: parsed.data.mode === "restock" ? "Stock added." : "Inventory correction recorded." };
}
export async function setPartArchived(formData: FormData) {
  await requireRole(["admin", "front_desk"]);
  const { error } = await (
    await createClient()
  ).rpc("set_part_archived", {
    target_part_id: value(formData, "partId"),
    archived: value(formData, "archived") === "true",
  });
  if (!error) revalidatePath("/inventory");
}
export async function usePart(_: InventoryActionState, formData: FormData): Promise<InventoryActionState> {
  await requireStaff();
  const workOrderId = value(formData, "workOrderId");
  const { error } = await (
    await createClient()
  ).rpc("confirm_work_order_part_usage", {
    target_work_order_id: workOrderId,
    target_part_id: value(formData, "partId"),
    quantity: Number(value(formData, "quantity")),
  });
  if (error) return { error: "Part use could not be confirmed. Check stock or duplicate usage." };
  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath("/inventory");
  return { message: "Part use confirmed and stock deducted." };
}
export async function reversePartUse(formData: FormData) {
  const staff = await requireStaff();
  const workOrderId = value(formData, "workOrderId");
  await (
    await createClient()
  ).rpc("reverse_work_order_part_usage", {
    target_work_order_part_id: value(formData, "partLineId"),
    reason: value(formData, "reason"),
  });
  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath("/inventory");
  if (staff.role !== "technician") revalidatePath("/work-orders");
}
