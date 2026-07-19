import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);
export const customerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a customer name with at least 2 characters.").max(160),
  phone: optionalText(40),
  email: z
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
  address: optionalText(500),
  notes: optionalText(4000),
});
export const vehicleSchema = z.object({
  customerId: z.string().uuid(),
  plateNumber: optionalText(40),
  make: optionalText(80),
  model: optionalText(80),
  modelYear: z.coerce.number().int().min(1886).max(2100).optional().or(z.literal("")),
  color: optionalText(60),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .max(17)
    .optional()
    .transform((value) => value || null),
  mileage: z.coerce.number().int().min(0).optional().or(z.literal("")),
  notes: optionalText(4000),
});
export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.enum(["wash", "maintenance", "repair"]),
  standardPriceMinor: z.coerce.number().int().min(0, "Price cannot be negative."),
  defaultDurationMinutes: z.coerce.number().int().min(1).max(1440),
  description: optionalText(4000),
});
export function normalizePhone(value: string) {
  return value.replace(/[^0-9+]/g, "");
}
export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
