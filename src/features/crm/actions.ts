"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { moneyInputToMinorUnits } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { customerSchema, serviceSchema, vehicleSchema } from "./validation";

export type CrmActionState = { error?: string; message?: string };
const value = (formData: FormData, name: string) => String(formData.get(name) ?? "");
const id = (formData: FormData, name: string) => value(formData, name);
const customerInput = (formData: FormData) => ({
  fullName: value(formData, "fullName"),
  phone: value(formData, "phone"),
  email: value(formData, "email"),
  address: value(formData, "address"),
  notes: value(formData, "notes"),
});
const vehicleInput = (formData: FormData) => ({
  customerId: value(formData, "customerId"),
  plateNumber: value(formData, "plateNumber"),
  make: value(formData, "make"),
  model: value(formData, "model"),
  modelYear: value(formData, "modelYear"),
  color: value(formData, "color"),
  vin: value(formData, "vin"),
  mileage: value(formData, "mileage"),
  notes: value(formData, "notes"),
});

export async function createCustomer(_: CrmActionState, formData: FormData): Promise<CrmActionState> {
  await requireRole(["admin", "front_desk"]);
  const parsed = customerSchema.safeParse(customerInput(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { data, error } = await (
    await createClient()
  )
    .from("customers")
    .insert({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Customer could not be saved." };
  redirect(`/customers/${data.id}`);
}
export async function updateCustomer(_: CrmActionState, formData: FormData): Promise<CrmActionState> {
  await requireRole(["admin", "front_desk"]);
  const parsed = customerSchema.safeParse(customerInput(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const customerId = id(formData, "customerId");
  const { error } = await (
    await createClient()
  )
    .from("customers")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      notes: parsed.data.notes,
    })
    .eq("id", customerId);
  if (error) return { error: "Customer could not be updated." };
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  return { message: "Customer updated." };
}
export async function setCustomerArchived(formData: FormData) {
  const actor = await requireRole(["admin", "front_desk"]);
  const customerId = id(formData, "customerId");
  const archived = value(formData, "archived") === "true";
  const { error } = await (
    await createClient()
  )
    .from("customers")
    .update({
      archived_at: archived ? new Date().toISOString() : null,
      archived_by: archived ? actor.id : null,
    })
    .eq("id", customerId);
  if (error) return;
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
}
export async function createVehicle(_: CrmActionState, formData: FormData): Promise<CrmActionState> {
  await requireRole(["admin", "front_desk"]);
  const parsed = vehicleSchema.safeParse(vehicleInput(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { data, error } = await (
    await createClient()
  )
    .from("vehicles")
    .insert({
      customer_id: parsed.data.customerId,
      plate_number: parsed.data.plateNumber,
      make: parsed.data.make,
      model: parsed.data.model,
      model_year: parsed.data.modelYear || null,
      color: parsed.data.color,
      vin: parsed.data.vin,
      mileage: parsed.data.mileage || null,
      mileage_recorded_at: parsed.data.mileage ? new Date().toISOString() : null,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();
  if (error || !data)
    return { error: "Vehicle could not be saved. Its active plate or VIN may already exist." };
  redirect(`/vehicles/${data.id}`);
}
export async function updateVehicle(_: CrmActionState, formData: FormData): Promise<CrmActionState> {
  await requireRole(["admin", "front_desk"]);
  const parsed = vehicleSchema.safeParse(vehicleInput(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const vehicleId = id(formData, "vehicleId");
  const { error } = await (
    await createClient()
  )
    .from("vehicles")
    .update({
      customer_id: parsed.data.customerId,
      plate_number: parsed.data.plateNumber,
      make: parsed.data.make,
      model: parsed.data.model,
      model_year: parsed.data.modelYear || null,
      color: parsed.data.color,
      vin: parsed.data.vin,
      mileage: parsed.data.mileage || null,
      mileage_recorded_at: parsed.data.mileage ? new Date().toISOString() : null,
      notes: parsed.data.notes,
    })
    .eq("id", vehicleId);
  if (error) return { error: "Vehicle could not be updated. Its active plate or VIN may already exist." };
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath(`/customers/${parsed.data.customerId}`);
  return { message: "Vehicle updated." };
}
export async function setVehicleArchived(formData: FormData) {
  const actor = await requireRole(["admin", "front_desk"]);
  const vehicleId = id(formData, "vehicleId");
  const customerId = id(formData, "customerId");
  const archived = value(formData, "archived") === "true";
  const { error } = await (
    await createClient()
  )
    .from("vehicles")
    .update({
      archived_at: archived ? new Date().toISOString() : null,
      archived_by: archived ? actor.id : null,
    })
    .eq("id", vehicleId);
  if (error) return;
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath(`/customers/${customerId}`);
}
export async function createService(_: CrmActionState, formData: FormData): Promise<CrmActionState> {
  await requireRole(["admin"]);
  const standardPriceMinor = moneyInputToMinorUnits(value(formData, "standardPrice"));
  if (standardPriceMinor === null)
    return { error: "Enter a valid non-negative price with up to 2 decimal places." };
  const parsed = serviceSchema.safeParse({
    name: value(formData, "name"),
    category: value(formData, "category"),
    standardPriceMinor,
    defaultDurationMinutes: value(formData, "defaultDurationMinutes"),
    description: value(formData, "description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { error } = await (
    await createClient()
  ).rpc("save_service", {
    target_service_id: null,
    service_name: parsed.data.name,
    service_category: parsed.data.category,
    service_description: parsed.data.description,
    price_minor: parsed.data.standardPriceMinor,
    duration_minutes: parsed.data.defaultDurationMinutes,
  });
  if (error) return { error: "Service could not be saved. A service with this name may already exist." };
  revalidatePath("/services");
  return { message: "Service created." };
}
export async function updateService(_: CrmActionState, formData: FormData): Promise<CrmActionState> {
  await requireRole(["admin"]);
  const standardPriceMinor = moneyInputToMinorUnits(value(formData, "standardPrice"));
  if (standardPriceMinor === null)
    return { error: "Enter a valid non-negative price with up to 2 decimal places." };
  const parsed = serviceSchema.safeParse({
    name: value(formData, "name"),
    category: value(formData, "category"),
    standardPriceMinor,
    defaultDurationMinutes: value(formData, "defaultDurationMinutes"),
    description: value(formData, "description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { error } = await (
    await createClient()
  ).rpc("save_service", {
    target_service_id: id(formData, "serviceId"),
    service_name: parsed.data.name,
    service_category: parsed.data.category,
    service_description: parsed.data.description,
    price_minor: parsed.data.standardPriceMinor,
    duration_minutes: parsed.data.defaultDurationMinutes,
  });
  if (error) return { error: "Service could not be updated. Existing work order snapshots are unchanged." };
  revalidatePath("/services");
  return { message: "Service updated. Existing work order snapshots are unchanged." };
}
export async function setServiceArchived(formData: FormData) {
  await requireRole(["admin"]);
  const serviceId = id(formData, "serviceId");
  const archived = value(formData, "archived") === "true";
  const { error } = await (
    await createClient()
  ).rpc("set_service_archived", { target_service_id: serviceId, archived });
  if (!error) revalidatePath("/services");
}
